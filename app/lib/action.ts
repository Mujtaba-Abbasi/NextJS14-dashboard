'use server';
import * as z from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
  customerId: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const rawFormValues = Object.fromEntries(formData.entries());
  const { amount, customerId, status } = CreateInvoice.parse(rawFormValues);
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  console.table(rawFormValues);

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  revalidateDataAndNavigate();
}

export async function updateInvoice(id: string, formData: FormData) {
  console.log('The form data =>', formData);

  const { amount, customerId, status } = CreateInvoice.parse(
    Object.fromEntries(formData.entries()),
  );

  const amountInCents = amount * 100;

  await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
    `;

  console.log('Updated');

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
  //   revalidateDataAndNavigate();
}

function revalidateDataAndNavigate() {
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
