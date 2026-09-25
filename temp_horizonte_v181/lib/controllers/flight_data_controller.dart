import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:sensors_plus/sensors_plus.dart';

class FlightDataController extends ChangeNotifier {
  StreamSubscription<AccelerometerEvent>? _accelSub;
  StreamSubscription<GyroscopeEvent>? _gyroSub;
  StreamSubscription<MagnetometerEvent>? _magSub;
  StreamSubscription<BarometerEvent>? _baroSub;
  StreamSubscription<Position>? _gpsSub;

  bool accelerometerOk = false;
  bool gyroscopeOk = false;
  bool magnetometerOk = false;
  bool barometerOk = false;
  bool gpsOk = false;
  bool locationPermissionGranted = false;

  String gpsMessage = 'GPS aguardando';
  String altitudeSource = '--';

  double qnhHpa = 1013.25;
  double? pressureHpa;
  double? baroAltitudeFt;
  double? gpsAltitudeFt;
  double? gpsAccuracyM;
  double? groundSpeedKt;
  double? gpsTrackDeg;
  double? magneticHeadingDeg;
  double? magneticFieldUt;
  double verticalSpeedFpm = 0.0;

  double accelerometerHz = 0.0;
  double gyroscopeHz = 0.0;
  double magnetometerHz = 0.0;
  double barometerHz = 0.0;

  DateTime? _lastAccel;
  DateTime? _lastGyro;
  DateTime? _lastMag;
  DateTime? _lastBaro;
  DateTime? _lastAltitudeTime;
  double? _lastAltitudeFt;
  DateTime _lastNotify = DateTime.fromMillisecondsSinceEpoch(0);

  double get altitudeFt => baroAltitudeFt ?? gpsAltitudeFt ?? 0.0;

  Future<void> start() async {
    await stop();

    _accelSub = accelerometerEventStream(
      samplingPeriod: SensorInterval.gameInterval,
    ).listen(
      (event) {
        accelerometerOk = true;
        accelerometerHz = _updateHz(_lastAccel, event.timestamp, accelerometerHz);
        _lastAccel = event.timestamp;
        _notifyLimited();
      },
      onError: (_) {
        accelerometerOk = false;
        _notifyLimited(force: true);
      },
      cancelOnError: false,
    );

    _gyroSub = gyroscopeEventStream(
      samplingPeriod: SensorInterval.gameInterval,
    ).listen(
      (event) {
        gyroscopeOk = true;
        gyroscopeHz = _updateHz(_lastGyro, event.timestamp, gyroscopeHz);
        _lastGyro = event.timestamp;
        _notifyLimited();
      },
      onError: (_) {
        gyroscopeOk = false;
        _notifyLimited(force: true);
      },
      cancelOnError: false,
    );

    _magSub = magnetometerEventStream(
      samplingPeriod: SensorInterval.uiInterval,
    ).listen(
      (event) {
        magnetometerOk = true;
        magnetometerHz = _updateHz(_lastMag, event.timestamp, magnetometerHz);
        _lastMag = event.timestamp;

        magneticFieldUt =
            math.sqrt(event.x * event.x + event.y * event.y + event.z * event.z);

        var hdg = math.atan2(event.x, -event.z) * 180.0 / math.pi;
        if (hdg < 0) hdg += 360.0;
        magneticHeadingDeg = hdg;
        _notifyLimited();
      },
      onError: (_) {
        magnetometerOk = false;
        _notifyLimited(force: true);
      },
      cancelOnError: false,
    );

    _baroSub = barometerEventStream(
      samplingPeriod: SensorInterval.uiInterval,
    ).listen(
      (event) {
        barometerOk = true;
        barometerHz = _updateHz(_lastBaro, event.timestamp, barometerHz);
        _lastBaro = event.timestamp;
        pressureHpa = event.pressure;
        baroAltitudeFt = _pressureToAltitudeFt(event.pressure, qnhHpa);
        altitudeSource = 'BARO';
        _updateVsi(baroAltitudeFt!, event.timestamp);
        _notifyLimited();
      },
      onError: (_) {
        barometerOk = false;
        baroAltitudeFt = null;
        altitudeSource = gpsAltitudeFt != null ? 'GPS' : '--';
        _notifyLimited(force: true);
      },
      cancelOnError: false,
    );

    await _startGps();
  }

  Future<void> _startGps() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      gpsOk = false;
      gpsMessage = 'Localizacao desativada';
      notifyListeners();
      return;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      locationPermissionGranted = false;
      gpsOk = false;
      gpsMessage = permission == LocationPermission.deniedForever
          ? 'Permissao GPS bloqueada'
          : 'Permissao GPS negada';
      notifyListeners();
      return;
    }

    locationPermissionGranted = true;
    gpsMessage = 'GPS procurando fix';

    const settings = LocationSettings(
      accuracy: LocationAccuracy.bestForNavigation,
      distanceFilter: 0,
    );

    _gpsSub = Geolocator.getPositionStream(
      locationSettings: settings,
    ).listen(
      (position) {
        gpsOk = true;
        gpsMessage = 'GPS OK';
        gpsAccuracyM = position.accuracy;
        gpsAltitudeFt = position.altitude * 3.280839895;
        groundSpeedKt =
            position.speed.isFinite && position.speed >= 0 ? position.speed * 1.943844492 : 0.0;

        if (position.heading.isFinite && position.heading >= 0) {
          gpsTrackDeg = position.heading % 360.0;
        }

        if (!barometerOk) {
          altitudeSource = 'GPS';
          _updateVsi(gpsAltitudeFt!, position.timestamp);
        }
        notifyListeners();
      },
      onError: (Object error) {
        gpsOk = false;
        gpsMessage = 'Falha GPS: $error';
        notifyListeners();
      },
      cancelOnError: false,
    );
  }

  double _pressureToAltitudeFt(double pressure, double qnh) {
    final ratio = (pressure / qnh).clamp(0.2, 2.0);
    return 145366.45 * (1.0 - math.pow(ratio, 0.190284).toDouble());
  }

  void _updateVsi(double altitude, DateTime timestamp) {
    final lastAlt = _lastAltitudeFt;
    final lastTime = _lastAltitudeTime;
    _lastAltitudeFt = altitude;
    _lastAltitudeTime = timestamp;

    if (lastAlt == null || lastTime == null) return;
    final dt = timestamp.difference(lastTime).inMicroseconds / 1000000.0;
    if (dt <= 0.03 || dt > 5.0) return;

    final instant = ((altitude - lastAlt) / dt * 60.0).clamp(-6000.0, 6000.0);
    verticalSpeedFpm = verticalSpeedFpm * 0.86 + instant * 0.14;
  }

  double _updateHz(DateTime? previous, DateTime current, double old) {
    if (previous == null) return old;
    final dt = current.difference(previous).inMicroseconds / 1000000.0;
    if (dt <= 0 || dt > 2) return old;
    final instant = 1.0 / dt;
    if (old <= 0) return instant;
    return old * 0.88 + instant * 0.12;
  }

  void setQnh(double value) {
    qnhHpa = value.clamp(850.0, 1100.0).toDouble();
    if (pressureHpa != null) {
      baroAltitudeFt = _pressureToAltitudeFt(pressureHpa!, qnhHpa);
      _lastAltitudeFt = null;
      _lastAltitudeTime = null;
      verticalSpeedFpm = 0.0;
    }
    notifyListeners();
  }

  void adjustQnh(double delta) => setQnh(qnhHpa + delta);

  Map<String, Object?> snapshot({
    required double pitchDeg,
    required double rollDeg,
  }) {
    return {
      'pitch_deg': pitchDeg,
      'roll_deg': rollDeg,
      'mag_hdg_deg': magneticHeadingDeg,
      'gps_trk_deg': gpsTrackDeg,
      'gs_kt': groundSpeedKt,
      'alt_ft': altitudeFt,
      'alt_source': altitudeSource,
      'baro_alt_ft': baroAltitudeFt,
      'gps_alt_ft': gpsAltitudeFt,
      'vsi_fpm': verticalSpeedFpm,
      'qnh_hpa': qnhHpa,
      'pressure_hpa': pressureHpa,
      'gps_accuracy_m': gpsAccuracyM,
      'mag_field_ut': magneticFieldUt,
      'accel_hz': accelerometerHz,
      'gyro_hz': gyroscopeHz,
      'mag_hz': magnetometerHz,
      'baro_hz': barometerHz,
    };
  }

  void _notifyLimited({bool force = false}) {
    final now = DateTime.now();
    if (force || now.difference(_lastNotify).inMilliseconds >= 100) {
      _lastNotify = now;
      notifyListeners();
    }
  }

  Future<void> stop() async {
    await _accelSub?.cancel();
    await _gyroSub?.cancel();
    await _magSub?.cancel();
    await _baroSub?.cancel();
    await _gpsSub?.cancel();
    _accelSub = null;
    _gyroSub = null;
    _magSub = null;
    _baroSub = null;
    _gpsSub = null;
  }

  @override
  void dispose() {
    unawaited(stop());
    super.dispose();
  }
}
