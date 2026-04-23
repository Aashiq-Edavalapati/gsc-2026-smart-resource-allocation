import 'package:flutter/material.dart';
import '../components/main/titlebar.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: MainTitleBar(),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 20),
            Text(
              "Latest Recordings",
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 10),
            Expanded(
              flex: 7, // 70% of the available space
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFFCCCCCC),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Center(child: Text("70% Height Container")),
              ),
            ),
            const Spacer(flex: 3), // Space before the button
            // New Recording Button
            SizedBox(
              width: double.infinity,
              height: 60,
              child: ElevatedButton.icon(
                onPressed: () {
                  // TODO: Start Recording
                },
                icon: const Icon(Icons.mic_none_rounded, color: Colors.white),
                label: Text(
                  "New Recording",
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF68417E),
                  foregroundColor: Colors.white,
                  shape: ContinuousRectangleBorder(
                    borderRadius: BorderRadius.circular(48),
                  ),
                  elevation: 10,
                  shadowColor: Colors.black.withOpacity(0.15),
                ),
              ),
            ),
            const SizedBox(height: 30), // Bottom padding
          ],
        ),
      ),
    );
  }
}
