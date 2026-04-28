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
      flexibleSpace: SizedBox.expand(
        child: ClipRect(
          child: FittedBox(
            fit: BoxFit.cover,
            alignment: Alignment.topCenter,
            child: Transform.scale(
              scale: 1.3,
              child: Image.asset('earth.gif'),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(100.0);
}
