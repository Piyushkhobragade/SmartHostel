/**
 * generateCredentialSlip — PDF Credential Slip Generator
 *
 * Generates a professional credential slip PDF using the Canvas API.
 * No external dependencies required.
 */

interface SlipData {
    hostelName: string;
    hostelPhone: string;
    hostelEmail: string;
    studentName: string;
    roomNumber: string;
    residentId: string;
    username: string;
    tempPassword: string;
    issuedBy: string;
}

function createSlipCanvas(data: SlipData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const dpi = 2; // Retina quality
    const width = 595 * dpi; // A4 width in points
    const height = 842 * dpi;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpi, dpi);

    const pageW = 595;
    const margin = 50;
    const contentW = pageW - margin * 2;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageW, 842);

    // Top accent bar
    const grad = ctx.createLinearGradient(0, 0, pageW, 0);
    grad.addColorStop(0, '#1e40af');
    grad.addColorStop(1, '#4f46e5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, pageW, 8);

    let y = 45;

    // ── HEADER ──────────────────────────────────────────────
    // Hostel logo placeholder (circle)
    ctx.beginPath();
    ctx.arc(margin + 22, y + 12, 20, 0, Math.PI * 2);
    const logoGrad = ctx.createLinearGradient(margin, y - 8, margin + 44, y + 32);
    logoGrad.addColorStop(0, '#2563eb');
    logoGrad.addColorStop(1, '#4f46e5');
    ctx.fillStyle = logoGrad;
    ctx.fill();

    // Building icon inside circle
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏠', margin + 22, y + 18);

    // Hostel name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText(data.hostelName.toUpperCase(), margin + 52, y + 6);

    // Subtitle
    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Resident Admission Credential Slip', margin + 52, y + 22);

    // Contact info right-aligned
    ctx.textAlign = 'right';
    ctx.font = '9px Arial, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`📞 ${data.hostelPhone}`, pageW - margin, y + 6);
    ctx.fillText(`✉ ${data.hostelEmail}`, pageW - margin, y + 20);

    y += 50;

    // Confidential badge
    ctx.textAlign = 'center';
    const badgeW = 170;
    const badgeX = (pageW - badgeW) / 2;
    ctx.fillStyle = '#fef2f2';
    ctx.beginPath();
    ctx.roundRect(badgeX, y, badgeW, 22, 11);
    ctx.fill();
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillText('🔒 CONFIDENTIAL — DO NOT SHARE', pageW / 2, y + 15);

    y += 40;
    ctx.textAlign = 'left';

    // ── DIVIDER ──────────────────────────────────────────────
    function drawDivider(atY: number) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin, atY);
        ctx.lineTo(pageW - margin, atY);
        ctx.stroke();
    }

    // ── SECTION: Resident Information ───────────────────────
    drawDivider(y);
    y += 20;
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('RESIDENT INFORMATION', margin, y);
    y += 20;

    const fieldPairs = [
        ['Full Name', data.studentName],
        ['Room Number', data.roomNumber],
        ['Admission Date', dateStr],
        ['Resident ID', data.residentId.substring(0, 8).toUpperCase()],
    ];

    ctx.font = '10px Arial, sans-serif';
    for (const [label, value] of fieldPairs) {
        ctx.fillStyle = '#64748b';
        ctx.fillText(label + ':', margin + 10, y);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 10px Arial, sans-serif';
        ctx.fillText(value, margin + 130, y);
        ctx.font = '10px Arial, sans-serif';
        y += 22;
    }

    y += 10;

    // ── SECTION: Login Credentials ──────────────────────────
    drawDivider(y);
    y += 20;
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('LOGIN CREDENTIALS', margin, y);
    y += 25;

    // Credential box with background
    const credBoxY = y - 5;
    const credBoxH = 80;
    ctx.fillStyle = '#f0f9ff';
    ctx.beginPath();
    ctx.roundRect(margin, credBoxY, contentW, credBoxH, 8);
    ctx.fill();
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1;
    ctx.stroke();

    const credFields = [
        ['Portal URL', window.location.origin],
        ['Username', data.username],
        ['Temporary Password', data.tempPassword],
    ];

    for (const [label, value] of credFields) {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px Arial, sans-serif';
        ctx.fillText(label + ':', margin + 15, y + 10);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(value, margin + 150, y + 10);
        y += 24;
    }

    y = credBoxY + credBoxH + 15;

    // Warning
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.roundRect(margin, y, contentW, 28, 6);
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ You MUST change your password on first login. This temporary password will expire.', pageW / 2, y + 18);
    ctx.textAlign = 'left';

    y += 45;

    // ── SECTION: Instructions ───────────────────────────────
    drawDivider(y);
    y += 20;
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('INSTRUCTIONS', margin, y);
    y += 22;

    const instructions = [
        '1. Visit the portal URL shown above in your web browser.',
        '2. Enter your username and temporary password to log in.',
        '3. You will be prompted to create a new personal password immediately.',
        '4. Securely destroy this slip after your first login is complete.',
    ];

    ctx.font = '10px Arial, sans-serif';
    ctx.fillStyle = '#334155';
    for (const line of instructions) {
        ctx.fillText(line, margin + 10, y);
        y += 20;
    }

    y += 15;

    // ── FOOTER ──────────────────────────────────────────────
    drawDivider(y);
    y += 18;

    ctx.fillStyle = '#64748b';
    ctx.font = '9px Arial, sans-serif';
    ctx.fillText(`Issued by: ${data.issuedBy}`, margin, y);
    ctx.textAlign = 'right';
    ctx.fillText(`Date: ${dateStr}  |  Time: ${timeStr}`, pageW - margin, y);
    ctx.textAlign = 'left';

    y += 18;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('This document is valid for one-time use only.', pageW / 2, y);
    y += 14;
    ctx.fillText('If this slip is lost before first login, contact the hostel administrator for a credential reset.', pageW / 2, y);
    y += 14;
    ctx.fillText(`${data.hostelName}  •  ${data.hostelPhone}  •  ${data.hostelEmail}`, pageW / 2, y);

    return canvas;
}

export function downloadCredentialSlip(data: SlipData) {
    const canvas = createSlipCanvas(data);
    const link = document.createElement('a');
    link.download = `credential-slip-${data.username}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

export function printCredentialSlip(data: SlipData) {
    const canvas = createSlipCanvas(data);
    const dataUrl = canvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow pop-ups to print the credential slip.');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Credential Slip — ${data.studentName}</title>
            <style>
                @media print {
                    @page { margin: 0; size: A4; }
                    body { margin: 0; }
                }
                body {
                    margin: 0;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    min-height: 100vh;
                    background: #f8fafc;
                }
                img {
                    max-width: 100%;
                    height: auto;
                }
            </style>
        </head>
        <body>
            <img src="${dataUrl}" />
            <script>
                window.onload = function() {
                    setTimeout(function() { window.print(); window.close(); }, 300);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}
