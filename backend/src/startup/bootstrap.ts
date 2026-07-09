import { startupDiagnostics } from "../services/ai/gemini";
import { startScheduler, stopScheduler } from "../services/scheduler";

export async function bootstrapApplication(): Promise<void> {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Starting background services");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    startScheduler();
    void startupDiagnostics();

    console.log("✅ Background services started.");
}

export { stopScheduler };
