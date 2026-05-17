import { TicketStatus, TicketCategory } from "../../server/src/generated/prisma";
import { prisma } from "../../server/src/lib/prisma";

export interface TestTicketOptions {
  subject: string;
  fromEmail: string;
  fromName: string;
  status?: TicketStatus;
  category?: TicketCategory;
}

export async function createTestTicket(
  options: TestTicketOptions,
): Promise<{ id: number }> {
  const {
    subject,
    fromEmail,
    fromName,
    status = TicketStatus.open,
    category,
  } = options;

  const ticket = await prisma.ticket.create({
    data: {
      subject,
      fromEmail,
      fromName,
      status,
      category,
    },
    select: { id: true },
  });

  return ticket;
}

export async function deleteTestTicket(id: number): Promise<void> {
  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (existing) {
    await prisma.ticket.delete({ where: { id } });
  }
}
