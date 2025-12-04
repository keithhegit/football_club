// 2D Pitch Canvas - Visual representation of match
// Shows player positions, ball location, and team shapes

import React, { useEffect, useRef } from 'react';
import { Position, TeamState } from '../engine/types';

interface PitchCanvasProps {
    homeTeam: TeamState;
    awayTeam: TeamState;
    ballPosition: Position;
    possession: 'home' | 'away';
    width?: number;
    height?: number;
}

export const PitchCanvas: React.FC<PitchCanvasProps> = ({
    homeTeam,
    awayTeam,
    ballPosition,
    possession,
    width = 600,
    height = 900
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw pitch
        drawPitch(ctx, width, height);

        // Draw players
        drawPlayers(ctx, homeTeam, 'home', width, height);
        drawPlayers(ctx, awayTeam, 'away', width, height);

        // Draw ball
        drawBall(ctx, ballPosition, width, height, possession);

    }, [homeTeam, awayTeam, ballPosition, possession, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="bg-green-800 rounded-lg shadow-xl"
            style={{
                border: '2px solid #1e293b',
                maxWidth: '100%',
                height: 'auto'
            }}
        />
    );
};

/**
 * Draw football pitch markings
 */
function drawPitch(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const padding = 20;
    const pitchWidth = width - padding * 2;
    const pitchHeight = height - padding * 2;

    // Pitch background (green)
    ctx.fillStyle = '#15803d';
    ctx.fillRect(padding, padding, pitchWidth, pitchHeight);

    // Pitch outline (white)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, pitchWidth, pitchHeight);

    // Center line
    ctx.beginPath();
    ctx.moveTo(padding, height / 2);
    ctx.lineTo(width - padding, height / 2);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Penalty areas
    const penaltyBoxWidth = pitchWidth * 0.6;
    const penaltyBoxHeight = pitchHeight * 0.18;

    // Top penalty area
    ctx.strokeRect(
        padding + (pitchWidth - penaltyBoxWidth) / 2,
        padding,
        penaltyBoxWidth,
        penaltyBoxHeight
    );

    // Bottom penalty area
    ctx.strokeRect(
        padding + (pitchWidth - penaltyBoxWidth) / 2,
        height - padding - penaltyBoxHeight,
        penaltyBoxWidth,
        penaltyBoxHeight
    );

    // Goal boxes (smaller)
    const goalBoxWidth = pitchWidth * 0.35;
    const goalBoxHeight = pitchHeight * 0.08;

    // Top goal box
    ctx.strokeRect(
        padding + (pitchWidth - goalBoxWidth) / 2,
        padding,
        goalBoxWidth,
        goalBoxHeight
    );

    // Bottom goal box
    ctx.strokeRect(
        padding + (pitchWidth - goalBoxWidth) / 2,
        height - padding - goalBoxHeight,
        goalBoxWidth,
        goalBoxHeight
    );

    // Penalty spots
    ctx.beginPath();
    ctx.arc(width / 2, padding + penaltyBoxHeight * 0.6, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(width / 2, height - padding - penaltyBoxHeight * 0.6, 3, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draw team players on pitch
 */
function drawPlayers(
    ctx: CanvasRenderingContext2D,
    team: TeamState,
    side: 'home' | 'away',
    canvasWidth: number,
    canvasHeight: number
) {
    const padding = 20;
    const pitchWidth = canvasWidth - padding * 2;
    const pitchHeight = canvasHeight - padding * 2;

    // Team colors
    const playerColor = side === 'home' ? '#3b82f6' : '#ef4444'; // Blue vs Red
    const textColor = '#ffffff';

    team.players.forEach((player, index) => {
        // Convert position (0-100) to canvas coordinates
        const x = padding + (player.currentPosition.x / 100) * pitchWidth;
        const y = padding + (player.currentPosition.y / 100) * pitchHeight;

        // Draw player circle
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = playerColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw player number
        ctx.fillStyle = textColor;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((index + 1).toString(), x, y);

        // Draw stamina indicator (small bar below player)
        if (player.stamina < 70) {
            const barWidth = 16;
            const barHeight = 2;
            const staminaPercent = player.stamina / 100;

            ctx.fillStyle = staminaPercent > 0.5 ? '#22c55e' : staminaPercent > 0.3 ? '#eab308' : '#ef4444';
            ctx.fillRect(x - barWidth / 2, y + 15, barWidth * staminaPercent, barHeight);
        }
    });
}

/**
 * Draw ball on pitch
 */
function drawBall(
    ctx: CanvasRenderingContext2D,
    position: Position,
    canvasWidth: number,
    canvasHeight: number,
    possession: 'home' | 'away'
) {
    const padding = 20;
    const pitchWidth = canvasWidth - padding * 2;
    const pitchHeight = canvasHeight - padding * 2;

    const x = padding + (position.x / 100) * pitchWidth;
    const y = padding + (position.y / 100) * pitchHeight;

    // Draw ball shadow
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // Draw ball
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw possession arrow
    const arrowY = y - 20;
    ctx.fillStyle = possession === 'home' ? '#3b82f6' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(x, arrowY - 10);
    ctx.lineTo(x - 5, arrowY);
    ctx.lineTo(x + 5, arrowY);
    ctx.closePath();
    ctx.fill();
}
