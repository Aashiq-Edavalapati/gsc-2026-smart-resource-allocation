import 'package:flutter/material.dart';

class FloatingNavBar extends StatelessWidget {
  const FloatingNavBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 70,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(35),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildNavItem(Icons.home_rounded, "Home", true),
          _buildNavItem(Icons.notifications_none_rounded, "Alerts", false),
          _buildNavItem(Icons.history_rounded, "History", false),
          _buildNavItem(Icons.person_outline_rounded, "Profile", false),
        ],
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, bool isSelected) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          color: isSelected ? const Color(0xFF68417E) : Colors.black38,
          size: 26,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: isSelected ? const Color(0xFF68417E) : Colors.black38,
            fontSize: 10,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
