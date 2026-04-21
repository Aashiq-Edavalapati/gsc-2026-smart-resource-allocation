import 'package:flutter/material.dart';
import '../components/mainpage/custom_navbar.dart';
import 'dashboard_page.dart';
import 'explore_page.dart';
import 'saved_page.dart';
import 'profile_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const DashboardPage(),
    const ExplorePage(),
    const SavedPage(),
    const ProfilePage(),
  ];

  void _onPageChanged(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          IndexedStack(
            index: _currentIndex,
            children: _pages,
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: CustomNavBar(
              currentIndex: _currentIndex,
              onTap: _onPageChanged,
            ),
          ),
        ],
      ),
    );
  }
}
