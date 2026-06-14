const CINETPAY_INIT_URL  = "https://api-checkout.cinetpay.com/v2/payment";
const CINETPAY_CHECK_URL = "https://api-checkout.cinetpay.com/v2/payment/check";

export const PLAN_PRICES: Record<"basic" | "pro", number> = {
  basic: 0,
  pro:   24900,
};

export const PLAN_LABELS: Record<"basic" | "pro", string> = {
  basic: "Basic",
  pro:   "Pro",
};

export interface CinetPayInitResult {
  paymentUrl: string;
  payToken:   string;
}

export interface CinetPayStatus {
  status:   "ACCEPTED" | "REFUSED" | "PENDING";
  amount:   number;
  metadata: string;
}

export async function initPaiement(params: {
  transactionId:  string;
  amount:         number;
  description:    string;
  returnUrl:      string;
  notifyUrl:      string;
  metadata?:      string;
}): Promise<CinetPayInitResult> {
  const apikey  = process.env.CINETPAY_API_KEY;
  const site_id = process.env.CINETPAY_SITE_ID;
  if (!apikey || !site_id) throw new Error("CinetPay non configuré (CINETPAY_API_KEY / CINETPAY_SITE_ID manquants).");

  const res = await fetch(CINETPAY_INIT_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      apikey,
      site_id,
      transaction_id: params.transactionId,
      amount:         params.amount,
      currency:       "XOF",
      description:    params.description,
      return_url:     params.returnUrl,
      notify_url:     params.notifyUrl,
      channels:       "ALL",
      metadata:       params.metadata ?? "",
    }),
  });
  const data = await res.json() as { code: string; message?: string; data?: { payment_url: string; pay_token: string } };
  if (data.code !== "201" || !data.data) {
    throw new Error(data.message ?? `CinetPay init error: code ${data.code}`);
  }
  return { paymentUrl: data.data.payment_url, payToken: data.data.pay_token };
}

export async function verifyPaiement(transactionId: string): Promise<CinetPayStatus> {
  const apikey  = process.env.CINETPAY_API_KEY;
  const site_id = process.env.CINETPAY_SITE_ID;
  if (!apikey || !site_id) throw new Error("CinetPay non configuré.");

  const res = await fetch(CINETPAY_CHECK_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ apikey, site_id, transaction_id: transactionId }),
  });
  const data = await res.json() as { code: string; message?: string; data?: { status: string; amount: number; metadata: string } };
  if (data.code !== "00" || !data.data) {
    throw new Error(data.message ?? `CinetPay check error: code ${data.code}`);
  }
  return {
    status:   data.data.status as CinetPayStatus["status"],
    amount:   data.data.amount,
    metadata: data.data.metadata ?? "",
  };
}

/** Generate a unique transaction ID for a shop payment. */
export function makeTransactionId(shopId: number, plan: string): string {
  return `SAAS-${shopId}-${plan.toUpperCase()}-${Date.now()}`;
}
