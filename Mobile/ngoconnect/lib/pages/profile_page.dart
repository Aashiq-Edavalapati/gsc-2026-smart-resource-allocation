import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../components/profile/profile_header.dart';
import '../components/profile/premium_card.dart';
import '../components/profile/profile_menu.dart';
import '../services/auth_service.dart';
import '../main.dart';

import 'package:geolocator/geolocator.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  @override
  void initState() {
    super.initState();
    // Initial fetch if data isn't already loaded
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AuthService>(context, listen: false).getUserProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF68417E);
    const backgroundColor = Color(0xFFF5F6FA);
    
    return Scaffold(
      backgroundColor: backgroundColor,
      body: Consumer<AuthService>(
        builder: (context, authService, child) {
          final profileData = authService.profileData;
          final user = authService.currentUser;
          
          if (profileData == null) {
            return const Center(child: CircularProgressIndicator());
          }
          
          final volunteerProfile = profileData['volunteerProfile'];
          final trustScore = profileData['trustScore'] ?? 0;
          final city = profileData['city'] ?? "Not set";
          final List<dynamic> skills = volunteerProfile?['skills'] ?? [];
          final availability = volunteerProfile?['availability'] ?? "Not set";
          
          return Column(
            children: [
              ProfileHeader(
                name: profileData?['name'] ?? user?.displayName ?? "Volunteer",
                email: user?.email ?? "email@example.com",
                imageUrl: user?.photoURL ?? 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=2787&auto=format&fit=crop',
                primaryColor: primaryColor,
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    PremiumCard(
                      title: "${profileData?['name']?.split(' ').first ?? user?.displayName?.split(' ').first ?? 'Volunteer'}, join NGO Connect+",
                      subtitle: "Your trust score: $trustScore. Support more causes and unlock advanced resource allocation analytics.",
                      primaryColor: primaryColor,
                    ),
                    const SizedBox(height: 24),
                    ProfileMenu(
                      sectionTitle: "PERSONAL INFO",
                      items: [
                        ProfileMenuItem(
                          Icons.location_city_rounded, 
                          "City: $city",
                          onTap: () => _showEditDialog(
                            context, 
                            "Edit City", 
                            "City Name", 
                            city == "Not set" ? "" : city, 
                            (val) => authService.updateUserProfile(city: val),
                            showLocationButton: true,
                            authService: authService,
                          ),
                        ),
                        ProfileMenuItem(
                          Icons.person_outline_rounded, 
                          "Name: ${profileData?['name'] ?? user?.displayName ?? 'User'}",
                          onTap: () => _showEditDialog(
                            context, 
                            "Edit Name", 
                            "Full Name", 
                            profileData?['name'] ?? user?.displayName ?? '', 
                            (val) => authService.updateUserProfile(name: val)
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    ProfileMenu(
                      sectionTitle: "VOLUNTEER PROFILE",
                      items: [
                        ProfileMenuItem(
                          Icons.build_circle_outlined, 
                          "Skills: ${skills.isEmpty ? 'None added' : skills.join(', ')}",
                          onTap: () => _showEditDialog(
                            context, 
                            "Edit Skills", 
                            "Skills (comma separated)", 
                            skills.join(', '), 
                            (val) => authService.updateVolunteerProfile(
                              val.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList(), 
                              availability
                            )
                          ),
                        ),
                        ProfileMenuItem(
                          Icons.calendar_today_rounded, 
                          "Availability: $availability",
                          onTap: () => _showEditDialog(
                            context, 
                            "Edit Availability", 
                            "Availability (e.g. Weekends)", 
                            availability == "Not set" ? "" : availability, 
                            (val) => authService.updateVolunteerProfile(
                              skills.cast<String>(), 
                              val
                            )
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    ProfileMenu(
                      sectionTitle: "ACCOUNT",
                      items: [
                        _LogoutMenuItem(authService, context),
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

  void _showEditDialog(
    BuildContext context, 
    String title, 
    String label, 
    String initialValue, 
    Future<bool> Function(String) onSave,
    {bool showLocationButton = false,
    AuthService? authService}
  ) {
    final controller = TextEditingController(text: initialValue);
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(title),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: controller,
                  decoration: InputDecoration(
                    labelText: label,
                    suffixIcon: showLocationButton ? IconButton(
                      icon: const Icon(Icons.my_location),
                      onPressed: () async {
                        try {
                          final position = await _getCurrentPosition();
                          // In a real app, you'd reverse geocode here.
                          // For now, we'll just set a placeholder or let them type,
                          // but we can save the lat/lng in the background.
                          await authService?.updateUserProfile(
                            lat: position.latitude,
                            lng: position.longitude,
                          );
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Coordinates updated from GPS")),
                          );
                        } catch (e) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text("Error: $e")),
                          );
                        }
                      },
                    ) : null,
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'This field cannot be empty';
                    }
                    if (value.trim().length < 2) {
                      return 'Too short';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
            ElevatedButton(
              onPressed: () async {
                if (formKey.currentState!.validate()) {
                  final success = await onSave(controller.text);
                  if (context.mounted) {
                    Navigator.pop(context);
                    if (success) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Profile updated successfully")),
                      );
                    }
                  }
                }
              }, 
              child: const Text("Save")
            ),
          ],
        ),
      ),
    );
  }

  Future<Position> _getCurrentPosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return Future.error('Location services are disabled.');
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return Future.error('Location permissions are denied');
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      return Future.error('Location permissions are permanently denied.');
    } 

    return await Geolocator.getCurrentPosition();
  }
}

class _LogoutMenuItem extends ProfileMenuItem {
  _LogoutMenuItem(AuthService authService, BuildContext context) 
    : super(
        Icons.logout_rounded, 
        "Logout", 
        onTap: () async {
          await authService.signOut();
          if (context.mounted) {
            // Clear navigation stack and go back to root (AuthWrapper)
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (context) => const AuthWrapper()),
              (route) => false,
            );
          }
        }
      );
}
