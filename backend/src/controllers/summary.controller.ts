import { Request, Response } from "express";
import { summaryService } from "../services/summary.service";

export const getSummary = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const summary = await summaryService.getSummary();

        res.json(summary);
    } catch (error) {
        console.error("Failed to fetch summary:", error);

        res.status(500).json({
            error: "Failed to fetch summary",
        });
    }
};
