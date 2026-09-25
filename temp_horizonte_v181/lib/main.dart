import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'ui/attitude_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

  runApp(const HorizonteArtificialApp());
}

class HorizonteArtificialApp extends StatelessWidget {
  const HorizonteArtificialApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Horizonte Artificial',
      theme: ThemeData(
        brightness: Brightness.dark,
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF00D7E9),
      ),
      home: const AttitudeScreen(),
    );
  }
}
