import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import TicketEditor from '@/components/tickets/TicketEditor';

interface Props {
  params: Promise<{ id: string }>
}

export default async function TicketDetailsPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in.</div>;
  }

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { 
      id,
      userId: user.id 
    }
  });

  if (!ticket) {
    notFound();
  }

  return <TicketEditor ticket={ticket} />;
}
