import 'package:flutter/material.dart';

class MainTitleBar extends StatelessWidget implements PreferredSizeWidget {
  const MainTitleBar({super.key});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: const Color(0xFFFAFAFA),
      elevation: 0,
      toolbarHeight: 100.0,
      title: const Text(
        '', // Empty for now as requested
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(100.0);
}
