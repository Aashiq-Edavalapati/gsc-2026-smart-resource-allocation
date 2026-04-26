import 'package:flutter/material.dart';
import '../components/profile/profile_header.dart';
import '../components/profile/premium_card.dart';
import '../components/profile/profile_menu.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF68417E);
    const backgroundColor = Color(0xFFF5F6FA);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Column(
        children: [
          const ProfileHeader(
            name: "Md Salim Hossan",
            email: "imran59415@gmail.com",
            imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=2787&auto=format&fit=crop',
            primaryColor: primaryColor,
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const PremiumCard(
                  title: "Md salim, join NGO Connect+",
                  subtitle: "Support more causes and unlock advanced resource allocation analytics.",
                  primaryColor: primaryColor,
                ),
                const SizedBox(height: 24),
                ProfileMenu(
                  sectionTitle: "CONTENT",
                  items: [
                    ProfileMenuItem(Icons.grid_view_rounded, "Connected Apps and Watches"),
                    ProfileMenuItem(Icons.directions_run_rounded, "My Training Data"),
                    ProfileMenuItem(Icons.settings_suggest_outlined, "Campaign Settings"),
                    ProfileMenuItem(Icons.notifications_none_rounded, "Notification Settings"),
                    ProfileMenuItem(Icons.people_outline_rounded, "Community Settings"),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
