import 'package:flutter/material.dart';
import 'pages/home_page.dart';
import 'utils/fonts/app_fonts.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NGO Connect',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
        textTheme: AppFonts.textTheme,
      ),
      home: const HomePage(),
    );
  }
}
