import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppFonts {
  static TextTheme get textTheme {
    return GoogleFonts.interTextTheme().copyWith(
      // Primary Font: Petrona
      displayLarge: GoogleFonts.petrona(),
      displayMedium: GoogleFonts.petrona(),
      displaySmall: GoogleFonts.petrona(),
      headlineLarge: GoogleFonts.petrona(),
      headlineMedium: GoogleFonts.petrona(),
      headlineSmall: GoogleFonts.petrona(),
      titleLarge: GoogleFonts.petrona(),
      titleMedium: GoogleFonts.petrona(),
      titleSmall: GoogleFonts.petrona(),
      
      // Secondary Font: Inter (already part of GoogleFonts.interTextTheme())
      // You can explicitly define them here if you want to override size/weight:
      bodyLarge: GoogleFonts.inter(),
      bodyMedium: GoogleFonts.inter(),
      bodySmall: GoogleFonts.inter(),
      labelLarge: GoogleFonts.inter(),
      labelMedium: GoogleFonts.inter(),
      labelSmall: GoogleFonts.inter(),
    );
  }

  // Handy helpers to use fonts directly
  static TextStyle primary({TextStyle? style}) => GoogleFonts.petrona(textStyle: style);
  static TextStyle secondary({TextStyle? style}) => GoogleFonts.inter(textStyle: style);
}
