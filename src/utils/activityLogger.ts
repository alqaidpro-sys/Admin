import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ActivityLog, AdminUser } from "../types";

/**
 * Centrally log any administrative actions in Firestore
 */
export async function logActivity(
  user: AdminUser,
  action: "create" | "update" | "delete",
  section: string,
  itemId: string,
  itemTitle: string
) {
  try {
    const logId = "log-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
    const newLog: ActivityLog = {
      id: logId,
      adminId: user.uid,
      adminName: user.name || "مشرف غير معروف",
      adminEmail: user.email,
      action,
      section,
      itemId,
      itemTitle: itemTitle || "بدون عنوان",
      timestamp: new Date().toISOString()
    };
    await setDoc(doc(db, "activity_logs", logId), newLog);
  } catch (error) {
    console.error("Failed to write audit activity log:", error);
  }
}
