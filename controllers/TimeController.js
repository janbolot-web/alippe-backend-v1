// import { TimerService } from "../services/timer-service.js";
// import mongoose from "mongoose";

// export const TimerController = {
//   // Get timer status
//   async getTimerStatus(req, res) {
//     try {
//       const { sessionId } = req.params;

//       if (!mongoose.Types.ObjectId.isValid(sessionId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid session ID",
//         });
//       }

//       const timerStatus = await TimerService.getTimerStatus(sessionId);

//       return res.status(200).json({
//         success: true,
//         timer: timerStatus,
//       });
//     } catch (error) {
//       console.error("Error getting timer status:", error);

//       return res.status(500).json({
//         success: false,
//         message: "An error occurred while getting the timer status",
//         error: error.message,
//       });
//     }
//   },

//   // Toggle timer (pause/resume)
//   async toggleTimer(req, res) {
//     try {
//       const { sessionId } = req.params;

//       if (!mongoose.Types.ObjectId.isValid(sessionId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid session ID",
//         });
//       }

//       const timer = await TimerService.toggleTimer(sessionId);

//       return res.status(200).json({
//         success: true,
//         timer: {
//           elapsedSeconds: timer.elapsedTime,
//           formattedTime: timer.getFormattedTime(),
//           isRunning: timer.isRunning,
//         },
//       });
//     } catch (error) {
//       console.error("Error toggling timer:", error);

//       return res.status(500).json({
//         success: false,
//         message: "An error occurred while toggling the timer",
//         error: error.message,
//       });
//     }
//   },

//   // Reset timer
//   async resetTimer(req, res) {
//     try {
//       const { sessionId } = req.params;

//       if (!mongoose.Types.ObjectId.isValid(sessionId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid session ID",
//         });
//       }

//       const timer = await TimerService.resetTimer(sessionId);

//       return res.status(200).json({
//         success: true,
//         timer: {
//           elapsedSeconds: timer.elapsedTime,
//           formattedTime: timer.getFormattedTime(),
//           isRunning: timer.isRunning,
//         },
//       });
//     } catch (error) {
//       console.error("Error resetting timer:", error);

//       return res.status(500).json({
//         success: false,
//         message: "An error occurred while resetting the timer",
//         error: error.message,
//       });
//     }
//   },
// };
