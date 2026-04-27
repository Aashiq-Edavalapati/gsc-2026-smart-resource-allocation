import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/task_service.dart';
import '../../components/main/task_card.dart';

class TasksPage extends StatefulWidget {
  const TasksPage({super.key});

  @override
  State<TasksPage> createState() => _TasksPageState();
}

class _TasksPageState extends State<TasksPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<TaskService>(context, listen: false).fetchMyAssignments();
    });
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF68417E);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: const Text(
          "My Tasks",
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: Consumer<TaskService>(
        builder: (context, taskService, child) {
          if (taskService.isLoading && taskService.myAssignments.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          }

          if (taskService.myAssignments.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.assignment_turned_in_outlined, size: 80, color: Colors.black.withOpacity(0.1)),
                  const SizedBox(height: 16),
                  const Text(
                    "You haven't applied for any tasks yet.",
                    style: TextStyle(color: Colors.black38, fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      // Navigate back to home or issues to find tasks
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: primaryColor),
                    child: const Text("Browse Issues", style: TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => taskService.fetchMyAssignments(),
            color: primaryColor,
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: taskService.myAssignments.length,
              itemBuilder: (context, index) {
                final assignment = taskService.myAssignments[index];
                return TaskCard(assignment: assignment);
              },
            ),
          );
        },
      ),
    );
  }
}
