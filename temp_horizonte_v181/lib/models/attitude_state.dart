import 'dart:math' as math;

const Object _unsetSensorMessage = Object();

class AttitudeState {
  const AttitudeState({
    required this.pitchDeg,
    required this.rollDeg,
    required this.isCalibrated,
    required this.sensorAvailable,
    required this.simulationMode,
    required this.accelerationTrusted,
    this.sensorMessage,
  });

  final double pitchDeg;
  final double rollDeg;
  final bool isCalibrated;
  final bool sensorAvailable;
  final bool simulationMode;
  final bool accelerationTrusted;
  final String? sensorMessage;

  bool get bankCritical => rollDeg.abs() > 60.0;
  bool get pitchCritical => pitchDeg.abs() > 30.0;
  bool get critical => bankCritical || pitchCritical;

  double get pitchRad => pitchDeg * math.pi / 180.0;
  double get rollRad => rollDeg * math.pi / 180.0;

  AttitudeState copyWith({
    double? pitchDeg,
    double? rollDeg,
    bool? isCalibrated,
    bool? sensorAvailable,
    bool? simulationMode,
    bool? accelerationTrusted,
    Object? sensorMessage = _unsetSensorMessage,
  }) {
    return AttitudeState(
      pitchDeg: pitchDeg ?? this.pitchDeg,
      rollDeg: rollDeg ?? this.rollDeg,
      isCalibrated: isCalibrated ?? this.isCalibrated,
      sensorAvailable: sensorAvailable ?? this.sensorAvailable,
      simulationMode: simulationMode ?? this.simulationMode,
      accelerationTrusted: accelerationTrusted ?? this.accelerationTrusted,
      sensorMessage: identical(sensorMessage, _unsetSensorMessage)
          ? this.sensorMessage
          : sensorMessage as String?,
    );
  }
}
