import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';

import '../models/attitude_state.dart';
import '../services/orientation_service.dart';
import '../utils/angle_utils.dart';

class AttitudeController extends ChangeNotifier {
  AttitudeController({OrientationService? orientationService})
      : _orientationService = orientationService ?? OrientationService();

  final OrientationService _orientationService;
  StreamSubscription<OrientationSample>? _sampleSub;

  double _rawPitch = 0.0;
  double _rawRoll = 0.0;
  double _zeroPitch = 0.0;
  double _zeroRoll = 0.0;
  bool _hasSensorSample = false;

  double _simulationPitch = 0.0;
  double _simulationRoll = 0.0;
  bool _autoSimulation = false;
  Timer? _simTimer;
  final Stopwatch _simClock = Stopwatch();

  bool nightMode = false;
  bool invertedPalette = false;
  bool simulationMode = false;
  double sensitivity = 1.0;
  bool invertPitchAxis = false;
  bool invertRollAxis = false;

  AttitudeState state = const AttitudeState(
    pitchDeg: 0.0,
    rollDeg: 0.0,
    isCalibrated: false,
    sensorAvailable: true,
    simulationMode: false,
    accelerationTrusted: true,
  );

  Future<void> start() async {
    _sampleSub = _orientationService.samples.listen(
      _onSample,
      onError: (Object error, StackTrace stackTrace) {
        state = state.copyWith(
          sensorAvailable: false,
          sensorMessage: 'Falha ao acessar acelerometro/giroscopio: $error',
        );
        notifyListeners();
      },
    );

    try {
      await _orientationService.start();
    } catch (error) {
      state = state.copyWith(
        sensorAvailable: false,
        sensorMessage: 'Sensores indisponiveis: $error',
      );
      notifyListeners();
    }
  }

  void _onSample(OrientationSample sample) {
    if (simulationMode) return;
    final firstTrustedSample = !_hasSensorSample && sample.accelerationTrusted;
    _hasSensorSample = true;
    _rawPitch = sample.pitchDeg;
    _rawRoll = sample.rollDeg;

    if (firstTrustedSample && !state.isCalibrated) {
      _zeroPitch = _rawPitch;
      _zeroRoll = _rawRoll;
      state = state.copyWith(isCalibrated: true);
    }

    if (!state.sensorAvailable || state.sensorMessage != null) {
      state = state.copyWith(sensorAvailable: true, sensorMessage: null);
    }
    _publish(
      pitch: wrapDegrees(_rawPitch - _zeroPitch),
      roll: wrapDegrees(_rawRoll - _zeroRoll),
      accelerationTrusted: sample.accelerationTrusted,
    );
  }

  void calibrate() {
    if (simulationMode) {
      _simulationPitch = 0.0;
      _simulationRoll = 0.0;
      state = state.copyWith(isCalibrated: true);
      _publish(pitch: 0.0, roll: 0.0, accelerationTrusted: true);
      return;
    }

    if (!_hasSensorSample) {
      state = state.copyWith(
        sensorMessage: 'Aguarde as primeiras amostras dos sensores antes de calibrar.',
      );
      notifyListeners();
      return;
    }

    _zeroPitch = _rawPitch;
    _zeroRoll = _rawRoll;
    state = state.copyWith(
      pitchDeg: 0.0,
      rollDeg: 0.0,
      isCalibrated: true,
    );
    notifyListeners();
  }

  void setSensitivity(double value) {
    sensitivity = value.clamp(0.35, 2.0).toDouble();
    _orientationService.sensitivity = sensitivity;
    notifyListeners();
  }

  void setPitchAxisInverted(bool value) {
    invertPitchAxis = value;
    _orientationService.pitchSign = value ? -1.0 : 1.0;
    notifyListeners();
  }

  void setRollAxisInverted(bool value) {
    invertRollAxis = value;
    _orientationService.rollSign = value ? -1.0 : 1.0;
    notifyListeners();
  }

  void setNightMode(bool value) {
    nightMode = value;
    notifyListeners();
  }

  void setInvertedPalette(bool value) {
    invertedPalette = value;
    notifyListeners();
  }

  void setSimulationMode(bool value) {
    simulationMode = value;
    if (simulationMode) {
      _simulationPitch = 0.0;
      _simulationRoll = 0.0;
      state = state.copyWith(
        simulationMode: true,
        pitchDeg: 0.0,
        rollDeg: 0.0,
        accelerationTrusted: true,
        sensorMessage: null,
      );
    } else {
      setAutoSimulation(false);
      state = state.copyWith(simulationMode: false);
      _publish(
        pitch: wrapDegrees(_rawPitch - _zeroPitch),
        roll: wrapDegrees(_rawRoll - _zeroRoll),
        accelerationTrusted: state.accelerationTrusted,
      );
    }
    notifyListeners();
  }

  void setSimulationPitch(double value) {
    _simulationPitch = value.clamp(-45.0, 45.0).toDouble();
    if (simulationMode && !_autoSimulation) {
      _publish(
        pitch: _simulationPitch,
        roll: _simulationRoll,
        accelerationTrusted: true,
      );
    }
  }

  void setSimulationRoll(double value) {
    _simulationRoll = value.clamp(-85.0, 85.0).toDouble();
    if (simulationMode && !_autoSimulation) {
      _publish(
        pitch: _simulationPitch,
        roll: _simulationRoll,
        accelerationTrusted: true,
      );
    }
  }

  bool get autoSimulation => _autoSimulation;
  double get simulationPitch => _simulationPitch;
  double get simulationRoll => _simulationRoll;

  void setAutoSimulation(bool value) {
    _autoSimulation = value;
    _simTimer?.cancel();
    _simTimer = null;

    if (value && simulationMode) {
      _simClock
        ..reset()
        ..start();
      _simTimer = Timer.periodic(const Duration(milliseconds: 16), (_) {
        final t = _simClock.elapsedMilliseconds / 1000.0;
        _simulationRoll = 52.0 * _sin(t * 0.72);
        _simulationPitch = 18.0 * _sin(t * 0.43);
        _publish(
          pitch: _simulationPitch,
          roll: _simulationRoll,
          accelerationTrusted: true,
        );
      });
    }
    notifyListeners();
  }

  double _sin(double value) => math.sin(value);

  void _publish({
    required double pitch,
    required double roll,
    required bool accelerationTrusted,
  }) {
    state = AttitudeState(
      pitchDeg: pitch,
      rollDeg: roll,
      isCalibrated: state.isCalibrated,
      sensorAvailable: state.sensorAvailable,
      simulationMode: simulationMode,
      accelerationTrusted: accelerationTrusted,
      sensorMessage: state.sensorMessage,
    );
    notifyListeners();
  }

  @override
  void dispose() {
    _simTimer?.cancel();
    _simClock.stop();
    _sampleSub?.cancel();
    unawaited(_orientationService.dispose());
    super.dispose();
  }
}
