import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { Room } from '../entities/room.entity';
import { Invoice } from '../entities/invoice.entity';
import { Contract } from '../entities/contract.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
  ) {}

  async getStats() {
    const [totalTenants, totalRooms, occupiedRooms, unpaidInvoices] = await Promise.all([
      this.tenantRepo.count(),
      this.roomRepo.count(),
      this.roomRepo.count({ where: { contracts: { status: 'active' } } }),
      this.invoiceRepo.find({ where: { status: 'unpaid' }, relations: ['contract'] })
    ]);
    
    const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const expiringContracts = await this.contractRepo.count({ 
       where: { status: 'active' } // Simple filter for now
    });

    return {
      totalTenants, totalRooms, occupiedRooms, totalDebt,
      unpaidInvoices: unpaidInvoices.length,
      expiringContracts,
      availableRooms: totalRooms - occupiedRooms
    };
  }

  async getAnalytics() {
    // Last 6 months revenue
    const invoices = await this.invoiceRepo.find({ relations: ['contract'] });
    const monthlyData = {};
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    
    invoices.forEach(inv => {
      const date = new Date(inv.createdAt);
      const monthLabel = `T${date.getMonth() + 1}`;
      if (!monthlyData[monthLabel]) monthlyData[monthLabel] = { revenue: 0, collected: 0, tenants: 0 };
      monthlyData[monthLabel].revenue += inv.totalAmount / 1000000;
      if (inv.status === 'paid') monthlyData[monthLabel].collected += inv.totalAmount / 1000000;
    });

    return Object.keys(monthlyData).map(key => ({
      name: key, 
      revenue: monthlyData[key].revenue, 
      collected: monthlyData[key].collected,
      tenants: 15 // Placeholder for now
    })).sort((a, b) => parseInt(a.name.slice(1)) - parseInt(b.name.slice(1)));
  }

  async getActivities() {
    const recentInvoices = await this.invoiceRepo.find({ order: { createdAt: 'DESC' }, take: 3, relations: ['contract', 'contract.room'] });
    const activities = recentInvoices.map(inv => ({
      id: `inv-${inv.id}`,
      type: inv.status === 'paid' ? 'success' : 'info',
      text: `${inv.status === 'paid' ? 'Đã thu tiền' : 'Mới tạo'} Hóa đơn #${inv.id} — ${inv.contract?.room?.name || 'Phòng'}`,
      time: 'Vừa xong',
      color: inv.status === 'paid' ? 'emerald' : 'blue'
    }));

    const recentTenants = await this.tenantRepo.find({ order: { id: 'DESC' }, take: 2 });
    recentTenants.forEach(t => activities.push({
      id: `ten-${t.id}`, type: 'success', text: `Thêm khách mới: ${t.fullName}`, time: 'Hôm nay', color: 'emerald'
    }));

    return activities;
  }

  async getTodos() {
    // ... same as before ...
    const today = new Date();
    const unpaid = await this.invoiceRepo.find({ where: { status: 'unpaid' }, relations: ['contract', 'contract.room'] });
    const expiring = await this.contractRepo.find({ where: { status: 'active' }, relations: ['room'] });

    const todos: { id: any; priority: string; text: string; done: boolean }[] = [];
    if (unpaid.length > 0) todos.push({ id: 1, priority: 'high', text: `Thu tiền chưa đóng: ${unpaid.length} phòng đang nợ`, done: false });
    
    expiring.forEach((c, idx) => {
      const end = new Date(c.endDate);
      const diff = Math.ceil((end.getTime() - today.getTime()) / 86400000);
      if (diff <= 30 && diff > 0) {
        todos.push({ id: `exp-${c.id}`, priority: 'medium', text: `Hợp đồng ${c.room?.name} sắp hết hạn (${diff} ngày)`, done: false });
      }
    });

    if (todos.length === 0) todos.push({ id: 100, priority: 'low', text: 'Chưa có việc khẩn cấp', done: true });
    return todos;
  }

  async getDebtors() {
    const unpaid = await this.invoiceRepo.find({ 
      where: { status: 'unpaid' }, 
      relations: ['contract', 'contract.room', 'contract.tenant'],
      order: { createdAt: 'ASC' }
    });
    return unpaid.map(inv => ({
      room: inv.contract?.room?.name || '?',
      tenant: inv.contract?.tenant?.fullName || '?',
      amount: inv.totalAmount,
      daysLate: Math.ceil((Date.now() - new Date(inv.createdAt).getTime()) / 86400000)
    }));
  }
}
