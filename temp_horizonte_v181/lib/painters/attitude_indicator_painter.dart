import 'dart:math' as math;
import 'dart:ui' show FontFeature;

import 'package:flutter/material.dart';

class AttitudeIndicatorPainter extends CustomPainter {
  const AttitudeIndicatorPainter({
    required this.pitchDeg,
    required this.rollDeg,
    required this.nightMode,
    required this.invertedPalette,
    required this.critical,
  });

  final double pitchDeg;
  final double rollDeg;
  final bool nightMode;
  final bool invertedPalette;
  final bool critical;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2.0, size.height / 2.0);
    final radius = math.min(size.width * 0.47, size.height * 0.48);

    final sky = nightMode
        ? const Color(0xFF180D0A)
        : (invertedPalette ? const Color(0xFF9A582F) : const Color(0xFF2F78B7));
    final earth = nightMode
        ? const Color(0xFF070403)
        : (invertedPalette ? const Color(0xFF2F78B7) : const Color(0xFF8A5436));
    final lineColor = nightMode ? const Color(0xFFFF9B3D) : Colors.white;
    final aircraftColor = nightMode ? const Color(0xFFFF3B30) : const Color(0xFFFFD34D);
    final bezel = nightMode ? const Color(0xFF1A0A05) : const Color(0xFF171A1E);

    canvas.drawCircle(center, radius + 8.0, Paint()..color = bezel);

    canvas.save();
    final instrumentPath = Path()..addOval(Rect.fromCircle(center: center, radius: radius));
    canvas.clipPath(instrumentPath);
    canvas.translate(center.dx, center.dy);
    canvas.rotate(-rollDeg * math.pi / 180.0);

    final pixelsPerDegree = radius / 28.0;
    final horizonY = pitchDeg * pixelsPerDegree;

    final large = radius * 3.2;
    canvas.drawRect(Rect.fromLTRB(-large, -large, large, horizonY), Paint()..color = sky);
    canvas.drawRect(Rect.fromLTRB(-large, horizonY, large, large), Paint()..color = earth);

    canvas.drawLine(
      Offset(-large, horizonY),
      Offset(large, horizonY),
      Paint()
        ..color = lineColor
        ..strokeWidth = 3.0,
    );

    _drawPitchLadder(
      canvas,
      radius: radius,
      horizonY: horizonY,
      pixelsPerDegree: pixelsPerDegree,
      color: lineColor,
    );

    canvas.restore();

    _drawBankScale(canvas, center, radius, lineColor);
    _drawBankPointer(canvas, center, radius, lineColor);
    _drawAircraftSymbol(canvas, center, aircraftColor, nightMode);
    _drawNumerics(canvas, size, lineColor);

    if (critical) {
      final alertPaint = Paint()
        ..color = const Color(0xFFE53935)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 7.0;
      canvas.drawCircle(center, radius - 3.0, alertPaint);
      _drawCriticalLabel(canvas, size);
    }
  }

  void _drawPitchLadder(
    Canvas canvas, {
    required double radius,
    required double horizonY,
    required double pixelsPerDegree,
    required Color color,
  }) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;

    final labelStyle = TextStyle(
      color: color,
      fontSize: math.max(11.0, radius * 0.045),
      fontWeight: FontWeight.w600,
    );

    for (var angle = -90; angle <= 90; angle += 5) {
      if (angle == 0) continue;

      final y = horizonY - angle * pixelsPerDegree;
      if (y.abs() > radius * 1.15) continue;

      final major = angle % 10 == 0;
      final halfWidth = major ? radius * 0.26 : radius * 0.14;
      canvas.drawLine(Offset(-halfWidth, y), Offset(halfWidth, y), paint);

      if (major && angle.abs() <= 40) {
        final text = '${angle.abs()}';
        _drawText(canvas, text, Offset(-halfWidth - 28.0, y - 9.0), labelStyle);
        _drawText(canvas, text, Offset(halfWidth + 10.0, y - 9.0), labelStyle);
      }
    }
  }

  void _drawBankScale(Canvas canvas, Offset center, double radius, Color color) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round;

    const marks = <double>[-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60];
    for (final mark in marks) {
      final theta = (-90.0 + mark) * math.pi / 180.0;
      final isMajor = mark == 0 || mark.abs() == 30 || mark.abs() == 60;
      final outer = radius * 0.92;
      final inner = radius * (isMajor ? 0.82 : 0.86);
      final p1 = center + Offset(math.cos(theta) * inner, math.sin(theta) * inner);
      final p2 = center + Offset(math.cos(theta) * outer, math.sin(theta) * outer);
      canvas.drawLine(p1, p2, paint);
    }

    final top = center + Offset(0, -radius * 0.96);
    final tri = Path()
      ..moveTo(top.dx, top.dy + 2)
      ..lineTo(top.dx - 9, top.dy + 15)
      ..lineTo(top.dx + 9, top.dy + 15)
      ..close();
    canvas.drawPath(tri, Paint()..color = color);
  }

  void _drawBankPointer(Canvas canvas, Offset center, double radius, Color color) {
    final angle = (-90.0 - rollDeg) * math.pi / 180.0;
    final pos = center + Offset(math.cos(angle) * radius * 0.77, math.sin(angle) * radius * 0.77);

    canvas.save();
    canvas.translate(pos.dx, pos.dy);
    canvas.rotate(angle + math.pi / 2.0);
    final path = Path()
      ..moveTo(0, -8)
      ..lineTo(-7, 7)
      ..lineTo(7, 7)
      ..close();
    canvas.drawPath(path, Paint()..color = color);
    canvas.restore();
  }

  void _drawAircraftSymbol(Canvas canvas, Offset center, Color color, bool night) {
    final outline = Paint()
      ..color = night ? const Color(0xFF2B0000) : Colors.black.withOpacity(0.75)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final main = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final path = Path()
      ..moveTo(center.dx - 92, center.dy)
      ..lineTo(center.dx - 28, center.dy)
      ..lineTo(center.dx - 12, center.dy + 14)
      ..lineTo(center.dx, center.dy + 2)
      ..lineTo(center.dx + 12, center.dy + 14)
      ..lineTo(center.dx + 28, center.dy)
      ..lineTo(center.dx + 92, center.dy);

    canvas.drawPath(path, outline);
    canvas.drawPath(path, main);
    canvas.drawCircle(center, 5.0, Paint()..color = color);
  }

  void _drawNumerics(Canvas canvas, Size size, Color color) {
    final style = TextStyle(
      color: color,
      fontSize: math.max(13.0, size.height * 0.035),
      fontWeight: FontWeight.w700,
      fontFeatures: const [FontFeature.tabularFigures()],
      shadows: const [Shadow(blurRadius: 3.0, color: Colors.black)],
    );

    _drawText(canvas, 'P ${_signed(pitchDeg)}°', Offset(size.width * 0.035, size.height * 0.055), style);
    _drawText(canvas, 'R ${_signed(rollDeg)}°', Offset(size.width * 0.035, size.height * 0.105), style);
  }

  void _drawCriticalLabel(Canvas canvas, Size size) {
    const style = TextStyle(
      color: Colors.white,
      fontSize: 17,
      fontWeight: FontWeight.w900,
      letterSpacing: 1.2,
      backgroundColor: Color(0xCCE53935),
    );
    final painter = TextPainter(
      text: const TextSpan(text: ' LIMITE DE ATITUDE ', style: style),
      textDirection: TextDirection.ltr,
    )..layout();
    painter.paint(canvas, Offset((size.width - painter.width) / 2.0, size.height * 0.80));
  }

  void _drawText(Canvas canvas, String text, Offset offset, TextStyle style) {
    final painter = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: TextDirection.ltr,
    )..layout();
    painter.paint(canvas, offset);
  }

  String _signed(double value) {
    final rounded = value.toStringAsFixed(1);
    return value > 0 ? '+$rounded' : rounded;
  }

  @override
  bool shouldRepaint(covariant AttitudeIndicatorPainter oldDelegate) {
    return pitchDeg != oldDelegate.pitchDeg ||
        rollDeg != oldDelegate.rollDeg ||
        nightMode != oldDelegate.nightMode ||
        invertedPalette != oldDelegate.invertedPalette ||
        critical != oldDelegate.critical;
  }
}
