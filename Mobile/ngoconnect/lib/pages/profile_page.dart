import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../components/profile/profile_header.dart';
import '../components/profile/premium_card.dart';
import '../components/profile/profile_menu.dart';
import '../services/auth_service.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF68417E);
    const backgroundColor = Color(0xFFF5F6FA);
    final authService = Provider.of<AuthService>(context);
    final user = authService.currentUser;

    return Scaffold(
      backgroundColor: backgroundColor,
      body: FutureBuilder<Map<String, dynamic>?>(
        future: authService.getUserProfile(),
        builder: (context, snapshot) {
          final profileData = snapshot.data;
          final trustScore = profileData?['trustScore'] ?? 0;
          
          return Column(
            children: [
              ProfileHeader(
                name: user?.displayName ?? "Volunteer",
                email: user?.email ?? "email@example.com",
                imageUrl: user?.photoURL ?? 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=2787&auto=format&fit=crop',
                primaryColor: primaryColor,
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    PremiumCard(
                      title: "${user?.displayName?.split(' ').first ?? 'Volunteer'}, join NGO Connect+",
                      subtitle: "Your trust score: $trustScore. Support more causes and unlock advanced resource allocation analytics.",
                      primaryColor: primaryColor,
                    ),
                    const SizedBox(height: 24),
                    ProfileMenu(
                      sectionTitle: "CONTENT",
                      items: [
                        ProfileMenuItem(Icons.grid_view_rounded, "Connected Apps"),
                        ProfileMenuItem(Icons.directions_run_rounded, "My Training Data"),
                        ProfileMenuItem(Icons.settings_suggest_outlined, "Campaign Settings"),
                        ProfileMenuItem(Icons.notifications_none_rounded, "Notifications"),
                      ],
                    ),
                    const SizedBox(height: 24),
                    ProfileMenu(
                      sectionTitle: "ACCOUNT",
                      items: [
                        _LogoutMenuItem(authService),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _LogoutMenuItem extends ProfileMenuItem {
  _LogoutMenuItem(AuthService authService) 
    : super(
        Icons.logout_rounded, 
        "Logout", 
        onTap: () => authService.signOut()
      );
}
