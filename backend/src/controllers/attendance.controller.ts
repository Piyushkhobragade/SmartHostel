import { Request, Response } from "express";
import { attendanceService } from "../services/attendance.service";

export const getAttendance = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const attendance = await attendanceService.getAttendance({
            date: req.query.date as string | undefined,
            residentId: req.query.residentId as string | undefined,
        });

        res.json(attendance);
    } catch (error) {
        console.error("Failed to fetch attendance:", error);

        res.status(500).json({
            error: "Failed to fetch attendance",
        });
    }
};

export const markAttendance = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const attendance = await attendanceService.markAttendance(req.body);

        res.json(attendance);
    } catch (error) {
        console.error("Failed to mark attendance:", error);

        res.status(500).json({
            error: "Failed to mark attendance",
        });
    }
};
