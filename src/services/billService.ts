// src/services/billService.ts

/**
 * @file Service functions for bill management.
 * This file will contain the business logic for creating, reading,
 * updating, and deleting bills, including the automatic generation
 * of monthly bills.
 */

import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import Room, { IRoom } from '@/models/Room';
import User from '@/models/User';

/**
 * Generates monthly bills for all active rooms.
 * This function will be called by a cron job.
 */
export async function generateMonthlyBills() {
  try {
    console.log('Starting monthly bill generation...');
    await connectDB();

    const now = new Date();
    const month = now.getMonth() + 1; // JavaScript months are 0-11
    const year = now.getFullYear();

    // 1. Find all rooms that are occupied and have a tenant assigned.
    const occupiedRooms = await Room.find({ isOccupied: true, tenantId: { $ne: null } }).populate('tenantId');

    if (occupiedRooms.length === 0) {
      console.log('No occupied rooms found. No bills to generate.');
      return { success: true, message: 'ไม่พบห้องพักที่มีผู้เช่า ไม่มีการสร้างบิล', generatedCount: 0 };
    }

    let generatedCount = 0;
    // Explicitly type the room to help TypeScript understand the shape of the populated document
    for (const room of occupiedRooms as (IRoom & { _id: any, tenantId: any })[]) {
      // 2. Check if a bill for the current month/year already exists for this room
      const existingBill = await Bill.findOne({ roomId: room._id, month, year });

      if (!existingBill) {
        // Defensive check: Ensure tenantId is populated and valid before creating a bill
        if (!room.tenantId || !room.tenantId?._id) {
          console.warn(`Skipping bill generation for room ${room.roomNumber} due to missing tenant data.`);
          continue; // Skip to the next room
        }

        // 3. Create a new bill
        // Water and electricity are fixed charges, not unit-based
        const waterAmount = room.waterPrice;
        const electricityAmount = room.electricityPrice;
        const newBill = new Bill({
          roomId: room._id,
          tenantId: room.tenantId, // Use the populated tenant object directly
          month,
          year,
          rentAmount: room.rentPrice,
          waterAmount,
          electricityAmount,
          totalAmount: room.rentPrice + waterAmount + electricityAmount,
          status: 'pending',
        });

        // 4. Save the new bill
        await newBill.save();
        generatedCount++;
        console.log(`Generated bill for room ${room.roomNumber}`);
      }
    }

    console.log(`Monthly bill generation complete. Generated ${generatedCount} bills.`);
    return { success: true, message: `สร้างบิลประจำเดือน ${month}/${year} สำเร็จ จำนวน ${generatedCount} รายการ`, generatedCount };
  } catch (error) {
    console.error('Error during bill generation:', error);
    throw new Error('Bill generation failed');
  }
}

/**
 * Creates a single bill manually.
 * @param billData - The data for the bill to create.
 */
export async function createManualBill(billData: any) {
  // Placeholder for manual bill creation logic
  return { success: true, data: { ...billData, _id: 'new_bill_id' } };
}