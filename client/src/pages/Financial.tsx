
import React, { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  BadgeDollarSign,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  Eye,
  FileCode2,
  FilePlus2,
  Filter,
  Landmark,
  LoaderCircle,
  Pencil,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Wallet,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type SaleItem = {
  id: string;
  contractNumber: string;
  clientId: string;
  clientName: string;
  developmentId: string;
  developmentName: string;
  lotId: string;
  lotCode: string;
  totalValue: number;
  downPaymentValue: number;
  financedAmount: number;
  installments: number;
  interestRate: number;
  firstInstallment: number;
  paymentMethod: string;
  saleDate: string;
  status: "rascunho" | "aguardando_assinatura" | "assinado" | "cancelado";
  signatureStatus: string;
};

type ReceivableItem = {
  id: string;
  saleId: string;
  clientId: string;
  clientName: string;
  developmentId?: string | null;
  developmentName?: string | null;
  lotId?: string | null;
  lotCode?: string | null;
  billingEntityId?: string | null;
  billingEntityName?: string | null;
  contractNumber: string;
  billingType: "boleto" | "carne" | "pix" | "outro";
  totalAmount: number;
  entryAmount: number;
  financedAmount: number;
  installmentsCount: number;
  firstDueDate?: string | null;
  dayOfMonth?: number | null;
  status: "aberto" | "parcial" | "quitado" | "atrasado" | "cancelado";
  createdAt?: string;
  updatedAt?: string;
};

type InstallmentItem = {
  id: string;
  receivableId: string;
  saleId: string;
  clientId: string;
  clientName: string;
  billingEntityId?: string | null;
  billingEntityName?: string | null;
  contractNumber: string;
  installmentNumber: number;
  installmentLabel: string;
  dueDate: string;
  nominalValue: number;
  discountValue: number;
  otherDeductionsValue: number;
  fineValue: number;
  otherAdditionsValue: number;
  paidValue: number;
  totalDue: number;
  status: "aberta" | "paga" | "atrasada" | "cancelada";
  paymentDate?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  boletoUrl?: string | null;
  linhaDigitavel?: string | null;
  barcode?: string | null;
  nossoNumero?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type CollectionEventItem = {
  id: string;
  receivableId?: string | null;
  installmentId?: string | null;
  saleId?: string | null;
  remittanceId?: string | null;
  eventType: string;
  eventStatus?: string | null;
  title?: string | null;
  description?: string | null;
  payload?: any;
  createdBy?: string | null;
  createdAt?: string | null;
};

type RemittanceType = "entrada" | "baixa" | "cancelamento";
type RemittanceStatus = "rascunho" | "gerada" | "enviada" | "processada" | "erro";

type RemittanceItem = {
  id: string;
  type: RemittanceType;
  status: RemittanceStatus;
  billingEntityId?: string | null;
  billingEntityName?: string | null;
  developmentId?: string | null;
  developmentName?: string | null;
  bankCode?: string | null;
  layoutCode?: string | null;
  sequenceNumber: number;
  fileName?: string | null;
  itemsCount: number;
  totalAmount: number;
  hasGeneratedContent: boolean;
  sentAt?: string | null;
  processedAt?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type RemittanceDetailItem = {
  id: string;
  remittanceId: string;
  receivableId?: string | null;
  installmentId: string;
  saleId?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  contractNumber: string;
  installmentNumber: number;
  installmentLabel: string;
  dueDate?: string | null;
  nominalValue: number;
  totalDue: number;
  nossoNumero?: string | null;
  linhaDigitavel?: string | null;
  barcode?: string | null;
  instructionCode?: string | null;
  movementCode?: string | null;
  status?: string | null;
  occurrenceCode?: string | null;
  occurrenceMessage?: string | null;
  returnPayload?: any;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type RemittanceDetailsResponse = {
  remittance: RemittanceItem;
  items: RemittanceDetailItem[];
};

type GenerateFinancialForm = {
  saleId: string;
  firstDueDate: string;
  installmentsCount: string;
  installmentValue: string;
  billingType: "boleto" | "carne" | "pix" | "outro";
  replaceExisting: boolean;
};

type ChargesForm = {
  discountValue: string;
  otherDeductionsValue: string;
  fineValue: string;
  otherAdditionsValue: string;
  notes: string;
};

type PaymentForm = ChargesForm & {
  paidValue: string;
  paymentDate: string;
  paymentMethod: string;
};

type CreateRemittanceForm = {
  type: RemittanceType;
  billingEntityId: string;
  billingEntityName: string;
  developmentId: string;
  developmentName: string;
  sourceMode: "selected" | "receivable" | "sale";
  receivableId: string;
  saleId: string;
  onlyEligible: boolean;
  autoGenerate: boolean;
  notes: string;
};

type MarkSentForm = {
  sentAt: string;
  fileName: string;
  notes: string;
};

type ImportReturnLine = {
  installmentId: string;
  label: string;
  include: boolean;
  status: "liquidado" | "baixado" | "cancelado" | "rejeitado" | "pago";
  paidValue: string;
  paymentDate: string;
  occurrenceCode: string;
  occurrenceMessage: string;
};

type ReceivableCancelForm = {
  reason: string;
  requestBankOps: boolean;
};

const today = new Date().toISOString().slice(0, 10);

const SICOOB_CONFIG = {
  bankCode: "756",
  currencyCode: "9",
  cooperativeCode: "3045",
  beneficiaryCode: "59469",
  carteiraCode: "1",
  modalidadeCode: "01",
};

const emptyGenerateForm: GenerateFinancialForm = {
  saleId: "NONE",
  firstDueDate: "",
  installmentsCount: "",
  installmentValue: "",
  billingType: "boleto",
  replaceExisting: false,
};

const emptyChargesForm: ChargesForm = {
  discountValue: "0",
  otherDeductionsValue: "0",
  fineValue: "0",
  otherAdditionsValue: "0",
  notes: "",
};

const emptyPaymentForm: PaymentForm = {
  discountValue: "0",
  otherDeductionsValue: "0",
  fineValue: "0",
  otherAdditionsValue: "0",
  paidValue: "",
  paymentDate: today,
  paymentMethod: "boleto",
  notes: "",
};

const emptyCreateRemittanceForm: CreateRemittanceForm = {
  type: "entrada",
  billingEntityId: "ALL",
  billingEntityName: "",
  developmentId: "ALL",
  developmentName: "",
  sourceMode: "selected",
  receivableId: "ALL",
  saleId: "ALL",
  onlyEligible: true,
  autoGenerate: true,
  notes: "",
};

const emptyMarkSentForm: MarkSentForm = {
  sentAt: today,
  fileName: "",
  notes: "",
};

const emptyReceivableCancelForm: ReceivableCancelForm = {
  reason: "",
  requestBankOps: true,
};

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const normalized = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizeDateValue(value?: string | null) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function formatDate(value?: string | null) {
  const normalized = normalizeDateValue(value);
  if (!normalized) return "-";

  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return normalized;
  return date.toLocaleDateString("pt-BR");
}

function statusBadgeVariant(
  status:
    | ReceivableItem["status"]
    | InstallmentItem["status"]
    | RemittanceStatus
    | string,
) {
  switch (status) {
    case "quitado":
    case "paga":
    case "gerada":
    case "processada":
      return "default";
    case "parcial":
    case "rascunho":
    case "enviada":
      return "secondary";
    case "atrasado":
    case "atrasada":
    case "erro":
      return "destructive";
    case "cancelado":
    case "cancelada":
      return "outline";
    case "aberto":
    case "aberta":
    default:
      return "secondary";
  }
}

function statusLabel(
  status:
    | ReceivableItem["status"]
    | InstallmentItem["status"]
    | RemittanceStatus
    | string,
) {
  switch (status) {
    case "aberto":
      return "Aberto";
    case "parcial":
      return "Parcial";
    case "quitado":
      return "Quitado";
    case "atrasado":
      return "Atrasado";
    case "cancelado":
      return "Cancelado";
    case "aberta":
      return "Aberta";
    case "paga":
      return "Paga";
    case "atrasada":
      return "Atrasada";
    case "cancelada":
      return "Cancelada";
    case "rascunho":
      return "Rascunho";
    case "gerada":
      return "Gerada";
    case "enviada":
      return "Enviada";
    case "processada":
      return "Processada";
    case "erro":
      return "Erro";
    default:
      return status;
  }
}

function remittanceTypeLabel(type: RemittanceType | string) {
  switch (type) {
    case "entrada":
      return "Entrada";
    case "baixa":
      return "Baixa";
    case "cancelamento":
      return "Cancelamento";
    default:
      return type;
  }
}

function escapeHtml(value?: string | number | null) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function digitsOnly(value?: string | number | null) {
  return String(value ?? "").replace(/\D/g, "");
}

function padLeft(value: string | number, length: number, char = "0") {
  return String(value).padStart(length, char);
}

function modulo10(value: string) {
  let sum = 0;
  let multiplier = 2;

  for (let i = value.length - 1; i >= 0; i -= 1) {
    const digit = Number(value[i]);
    let partial = digit * multiplier;

    if (partial > 9) {
      partial = Math.floor(partial / 10) + (partial % 10);
    }

    sum += partial;
    multiplier = multiplier === 2 ? 1 : 2;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

function modulo11Barcode(value: string) {
  let sum = 0;
  let weight = 2;

  for (let i = value.length - 1; i >= 0; i -= 1) {
    sum += Number(value[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  const remainder = sum % 11;
  const dv = 11 - remainder;

  if (dv === 0 || dv === 10 || dv === 11) return 1;
  return dv;
}

function modulo11NossoNumero(sequence: string) {
  const pattern = "3197";
  const repeated = pattern.repeat(Math.ceil(sequence.length / pattern.length)).slice(
    0,
    sequence.length,
  );

  let sum = 0;

  for (let i = 0; i < sequence.length; i += 1) {
    sum += Number(sequence[i]) * Number(repeated[i]);
  }

  const remainder = sum % 11;

  if (remainder === 0 || remainder === 1) return 0;
  return 11 - remainder;
}

function calcFatorVencimento(dateString?: string | null) {
  const normalized = normalizeDateValue(dateString);
  if (!normalized) return "0000";

  const dueDate = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(dueDate.getTime())) return "0000";

  const baseOld = new Date("2000-07-03T00:00:00");
  const baseNew = new Date("2025-02-22T00:00:00");
  const oneDay = 1000 * 60 * 60 * 24;

  if (dueDate >= baseNew) {
    const diff = Math.floor((dueDate.getTime() - baseNew.getTime()) / oneDay);
    return padLeft(diff + 1000, 4);
  }

  const diff = Math.floor((dueDate.getTime() - baseOld.getTime()) / oneDay);
  return padLeft(diff + 1000, 4);
}

function formatValueToBarcode(value: number) {
  const cents = Math.round((Number(value || 0) + Number.EPSILON) * 100);
  return padLeft(cents, 10);
}

function buildNossoNumeroBase(contractNumber: string, installmentNumber: number) {
  const contractDigits = digitsOnly(contractNumber);
  const contractPart = padLeft(contractDigits.slice(-4) || "0", 4);
  const installmentPart = padLeft(Math.max(1, installmentNumber), 3);
  return `${contractPart}${installmentPart}`;
}

function buildNossoNumero(contractNumber: string, installmentNumber: number) {
  const cooperative = padLeft(SICOOB_CONFIG.cooperativeCode, 4);
  const beneficiary = padLeft(SICOOB_CONFIG.beneficiaryCode, 10);
  const base = buildNossoNumeroBase(contractNumber, installmentNumber);

  const sequence = `${cooperative}${beneficiary}${base}`;
  const dv = modulo11NossoNumero(sequence);

  return {
    base,
    dv: String(dv),
    fieldValue: `${base}${dv}`,
    displayValue: `${base}-${dv}`,
  };
}

function buildCampoLivre(input: {
  contractNumber: string;
  installmentNumber: number;
}) {
  const nossoNumero = buildNossoNumero(
    input.contractNumber,
    input.installmentNumber,
  );

  const carteira = padLeft(SICOOB_CONFIG.carteiraCode, 1);
  const cooperativa = padLeft(SICOOB_CONFIG.cooperativeCode, 4);
  const modalidade = padLeft(SICOOB_CONFIG.modalidadeCode, 2);
  const beneficiario7 = padLeft(SICOOB_CONFIG.beneficiaryCode, 7);
  const parcela = padLeft(
    Math.min(Math.max(input.installmentNumber, 1), 999),
    3,
  );

  const campoLivre = `${carteira}${cooperativa}${modalidade}${beneficiario7}${nossoNumero.fieldValue}${parcela}`;

  return {
    campoLivre,
    nossoNumero,
  };
}

function buildBarcode(input: {
  dueDate: string;
  value: number;
  contractNumber: string;
  installmentNumber: number;
}) {
  const fator = calcFatorVencimento(input.dueDate);
  const valueField = formatValueToBarcode(input.value);
  const { campoLivre, nossoNumero } = buildCampoLivre({
    contractNumber: input.contractNumber,
    installmentNumber: input.installmentNumber,
  });

  const withoutDv = `${SICOOB_CONFIG.bankCode}${SICOOB_CONFIG.currencyCode}${fator}${valueField}${campoLivre}`;
  const dv = modulo11Barcode(withoutDv);
  const barcode = `${SICOOB_CONFIG.bankCode}${SICOOB_CONFIG.currencyCode}${dv}${fator}${valueField}${campoLivre}`;

  return {
    barcode,
    nossoNumero,
  };
}

function formatLinhaDigitavelField(value: string) {
  return `${value.slice(0, 5)}.${value.slice(5)}`;
}

function buildLinhaDigitavel(barcode: string) {
  const field1 = `${barcode.slice(0, 4)}${barcode.slice(19, 24)}`;
  const field2 = barcode.slice(24, 34);
  const field3 = barcode.slice(34, 44);
  const field4 = barcode.slice(4, 5);
  const field5 = barcode.slice(5, 19);

  const dv1 = modulo10(field1);
  const dv2 = modulo10(field2);
  const dv3 = modulo10(field3);

  return [
    formatLinhaDigitavelField(`${field1}${dv1}`),
    formatLinhaDigitavelField(`${field2}${dv2}`),
    formatLinhaDigitavelField(`${field3}${dv3}`),
    field4,
    field5,
  ].join(" ");
}

function getFallbackBankingData(installment: InstallmentItem) {
  const value = Number(installment.totalDue || installment.nominalValue || 0);
  const dueDate = normalizeDateValue(installment.dueDate) || today;

  const { barcode, nossoNumero } = buildBarcode({
    dueDate,
    value,
    contractNumber: installment.contractNumber,
    installmentNumber: installment.installmentNumber,
  });

  return {
    nossoNumero: installment.nossoNumero || nossoNumero.displayValue,
    barcode: installment.barcode || barcode,
    linhaDigitavel: installment.linhaDigitavel || buildLinhaDigitavel(barcode),
  };
}

function calculateChargedValueFromForm(
  nominalValue: number,
  form: ChargesForm | PaymentForm,
) {
  return (
    Number(nominalValue || 0) -
    toNumber(form.discountValue) -
    toNumber(form.otherDeductionsValue) +
    toNumber(form.fineValue) +
    toNumber(form.otherAdditionsValue)
  );
}

function buildInterleaved2of5Svg(rawCode: string) {
  const code = digitsOnly(rawCode);

  if (!code || code.length % 2 !== 0) {
    return `<div style="font-family:Consolas,monospace;font-size:11px;text-align:center;padding-top:20px;">${escapeHtml(rawCode)}</div>`;
  }

  const patterns: Record<string, string> = {
    "0": "nnwwn",
    "1": "wnnnw",
    "2": "nwnnw",
    "3": "wwnnn",
    "4": "nnwnw",
    "5": "wnwnn",
    "6": "nwwnn",
    "7": "nnnww",
    "8": "wnnwn",
    "9": "nwnwn",
  };

  const narrow = 2;
  const wide = 5;
  const height = 54;
  const quiet = 10;

  let x = quiet;
  const rects: string[] = [];

  const addBar = (width: number) => {
    rects.push(
      `<rect x="${x}" y="0" width="${width}" height="${height}" fill="#000" />`,
    );
    x += width;
  };

  const addSpace = (width: number) => {
    x += width;
  };

  addBar(narrow);
  addSpace(narrow);
  addBar(narrow);
  addSpace(narrow);

  for (let i = 0; i < code.length; i += 2) {
    const bars = patterns[code[i]];
    const spaces = patterns[code[i + 1]];

    for (let j = 0; j < 5; j += 1) {
      addBar(bars[j] === "w" ? wide : narrow);
      addSpace(spaces[j] === "w" ? wide : narrow);
    }
  }

  addBar(wide);
  addSpace(narrow);
  addBar(narrow);

  const totalWidth = x + quiet;

  return `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${totalWidth}"
         height="${height}"
         viewBox="0 0 ${totalWidth} ${height}"
         preserveAspectRatio="none"
         role="img"
         aria-label="Código de barras">
      <rect x="0" y="0" width="${totalWidth}" height="${height}" fill="#fff" />
      ${rects.join("")}
    </svg>
  `;
}

function buildPrintableBoletoHtml(
  installment: InstallmentItem,
  receivable?: ReceivableItem | null,
) {
  const logoUrl = `${window.location.origin}/images/sicoob-logo.png`;
  const bankData = getFallbackBankingData(installment);
  const valorCobrado = Number(installment.totalDue || installment.nominalValue || 0);
  const barcodeSvg = buildInterleaved2of5Svg(bankData.barcode);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Boleto - ${escapeHtml(installment.contractNumber)} - ${escapeHtml(
    installment.installmentLabel,
  )}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 8px;
      background: #f5f7fb;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
    }
    .page {
      width: 198mm;
      min-height: 136mm;
      margin: 0 auto;
      background: white;
      border: 1px solid #222;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #d1d5db;
      background: #f8fafc;
    }
    .toolbar-buttons {
      display: flex;
      gap: 8px;
    }
    .btn {
      border: 1px solid #cbd5e1;
      background: white;
      color: #111827;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      cursor: pointer;
    }
    .btn.primary {
      background: #0f766e;
      border-color: #0f766e;
      color: white;
    }
    .doc {
      padding: 6px;
    }
    .top-line {
      display: grid;
      grid-template-columns: 42mm 16mm 1fr;
      align-items: stretch;
      border-bottom: 1px solid #222;
    }
    .logo-cell {
      min-height: 42px;
      display: flex;
      align-items: center;
      padding: 3px 6px;
      border-right: 1px solid #222;
    }
    .logo-cell img {
      max-height: 28px;
      max-width: 38mm;
      object-fit: contain;
    }
    .bank-code {
      min-height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 700;
      border-right: 1px solid #222;
    }
    .linha {
      min-height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      padding: 0 6px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      letter-spacing: 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      border-left: 1px solid #222;
      border-top: 1px solid #222;
      margin-top: 0;
    }
    .cell {
      border-right: 1px solid #222;
      border-bottom: 1px solid #222;
      min-height: 38px;
      padding: 3px 5px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }
    .label {
      font-size: 9px;
      color: #222;
      margin-bottom: 3px;
      line-height: 1.1;
    }
    .value {
      font-size: 11px;
      font-weight: 700;
      color: #111827;
      word-break: break-word;
      line-height: 1.15;
    }
    .value.small {
      font-size: 10px;
    }
    .mono {
      font-family: Consolas, monospace;
    }
    .span-1 { grid-column: span 1; }
    .span-2 { grid-column: span 2; }
    .span-3 { grid-column: span 3; }
    .span-7 { grid-column: span 7; }
    .instructions {
      min-height: 88px;
    }
    .payer {
      min-height: 62px;
    }
    .barcode-row {
      display: grid;
      grid-template-columns: 1fr 52mm;
      align-items: end;
      gap: 8px;
      margin-top: 8px;
    }
    .barcode-box {
      border-top: 1px solid #222;
      padding-top: 6px;
      min-height: 72px;
    }
    .barcode-svg-wrap {
      width: 100%;
      height: 54px;
      border: 1px solid #222;
      display: flex;
      align-items: stretch;
      justify-content: stretch;
      background: white;
      overflow: hidden;
    }
    .barcode-svg-wrap svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .barcode-digits {
      margin-top: 4px;
      font-family: Consolas, monospace;
      font-size: 10px;
      text-align: center;
      word-break: break-all;
    }
    .comp {
      text-align: right;
      font-size: 10px;
      padding-bottom: 8px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .page {
        width: 100%;
        min-height: auto;
        border: 0;
      }
      .toolbar {
        display: none;
      }
      @page {
        size: A5 landscape;
        margin: 6mm;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="toolbar">
      <div><strong>Boleto / Cobrança para impressão</strong></div>
      <div class="toolbar-buttons">
        <button class="btn primary" onclick="window.print()">Imprimir / Salvar PDF</button>
        <button class="btn" onclick="window.close()">Fechar</button>
      </div>
    </div>

    <div class="doc">
      <div class="top-line">
        <div class="logo-cell">
          <img
            src="${escapeHtml(logoUrl)}"
            alt="Sicoob"
            onerror="this.style.display='none'; this.parentNode.innerHTML='<strong>SICOOB</strong>';"
          />
        </div>
        <div class="bank-code">756</div>
        <div class="linha">${escapeHtml(bankData.linhaDigitavel)}</div>
      </div>

      <div class="grid">
        <div class="cell span-7">
          <div class="label">Local de pagamento</div>
          <div class="value">PAGÁVEL PREFERENCIALMENTE NO SICOOB</div>
        </div>
        <div class="cell span-3">
          <div class="label">Vencimento</div>
          <div class="value">${escapeHtml(formatDate(installment.dueDate))}</div>
        </div>

        <div class="cell span-7">
          <div class="label">Beneficiário</div>
          <div class="value">${escapeHtml(
            installment.billingEntityName || receivable?.billingEntityName || "Beneficiário",
          )}</div>
        </div>
        <div class="cell span-3">
          <div class="label">Cooperativa/Código beneficiário</div>
          <div class="value small">${escapeHtml(
            `${SICOOB_CONFIG.cooperativeCode} / ${SICOOB_CONFIG.beneficiaryCode}`,
          )}</div>
        </div>

        <div class="cell span-2">
          <div class="label">Data do documento</div>
          <div class="value">${escapeHtml(
            formatDate(receivable?.firstDueDate || installment.dueDate),
          )}</div>
        </div>
        <div class="cell span-2">
          <div class="label">N. documento</div>
          <div class="value">${escapeHtml(installment.contractNumber)}</div>
        </div>
        <div class="cell span-2">
          <div class="label">Espécie doc.</div>
          <div class="value">FAT</div>
        </div>
        <div class="cell span-1">
          <div class="label">Aceite</div>
          <div class="value">N</div>
        </div>
        <div class="cell span-2">
          <div class="label">Processamento</div>
          <div class="value">${escapeHtml(
            new Date().toLocaleDateString("pt-BR"),
          )}</div>
        </div>
        <div class="cell span-1">
          <div class="label">Nosso número</div>
          <div class="value small mono">${escapeHtml(bankData.nossoNumero)}</div>
        </div>

        <div class="cell span-2">
          <div class="label">Uso do banco</div>
          <div class="value">-</div>
        </div>
        <div class="cell span-1">
          <div class="label">Carteira</div>
          <div class="value">${escapeHtml(SICOOB_CONFIG.carteiraCode)}</div>
        </div>
        <div class="cell span-1">
          <div class="label">Moeda</div>
          <div class="value">REAL</div>
        </div>
        <div class="cell span-2">
          <div class="label">Parcela</div>
          <div class="value">${escapeHtml(installment.installmentLabel)}</div>
        </div>
        <div class="cell span-1">
          <div class="label">Valor</div>
          <div class="value">-</div>
        </div>
        <div class="cell span-3">
          <div class="label">Valor documento</div>
          <div class="value">${escapeHtml(
            formatCurrency(installment.nominalValue || 0),
          )}</div>
        </div>

        <div class="cell span-7 instructions">
          <div class="label">Instruções</div>
          <div class="value small">
            Empreendimento: ${escapeHtml(receivable?.developmentName || "-")}<br/>
            Lote: ${escapeHtml(receivable?.lotCode || "-")}<br/>
            Parcela: ${escapeHtml(installment.installmentLabel)}<br/>
            Cliente: ${escapeHtml(installment.clientName)}<br/><br/>
            ${escapeHtml(installment.notes || "EMITIDO PELO SISTEMA SMARTLOTEIA")}
          </div>
        </div>
        <div class="cell span-3">
          <div class="label">(-) Desconto / Abatimento</div>
          <div class="value">${escapeHtml(
            formatCurrency(installment.discountValue || 0),
          )}</div>
        </div>

        <div class="cell span-7 payer">
          <div class="label">Pagador</div>
          <div class="value">${escapeHtml(installment.clientName)}</div>
          <div class="value small" style="margin-top:6px;">
            Empreendimento: ${escapeHtml(receivable?.developmentName || "-")}<br/>
            Lote: ${escapeHtml(receivable?.lotCode || "-")}
          </div>
        </div>
        <div class="cell span-3">
          <div class="label">(-) Outras deduções</div>
          <div class="value">${escapeHtml(
            formatCurrency(installment.otherDeductionsValue || 0),
          )}</div>
        </div>

        <div class="cell span-7">
          <div class="label">Sacador / Avalista</div>
          <div class="value">-</div>
        </div>
        <div class="cell span-3">
          <div class="label">(+) Mora / Multa</div>
          <div class="value">${escapeHtml(
            formatCurrency(installment.fineValue || 0),
          )}</div>
        </div>

        <div class="cell span-7">
          <div class="label"> </div>
          <div class="value"> </div>
        </div>
        <div class="cell span-3">
          <div class="label">(+) Outros acréscimos</div>
          <div class="value">${escapeHtml(
            formatCurrency(installment.otherAdditionsValue || 0),
          )}</div>
        </div>

        <div class="cell span-7">
          <div class="label"> </div>
          <div class="value"> </div>
        </div>
        <div class="cell span-3">
          <div class="label">(=) Valor cobrado</div>
          <div class="value">${escapeHtml(formatCurrency(valorCobrado))}</div>
        </div>
      </div>

      <div class="barcode-row">
        <div class="barcode-box">
          <div class="barcode-svg-wrap">
            ${barcodeSvg}
          </div>
          <div class="barcode-digits">${escapeHtml(bankData.barcode)}</div>
        </div>
        <div class="comp">Autenticação mecânica &nbsp;&nbsp;-&nbsp;&nbsp; Ficha de compensação</div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener("load", function () {
      setTimeout(function () {
        window.print();
      }, 300);
    });
  </script>
</body>
</html>`;
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}


export default function Financial() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeView, setActiveView] = useState<"installments" | "receivables" | "remittances">("installments");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [remittanceFilter, setRemittanceFilter] = useState("ALL");
  const [selectedInstallmentIds, setSelectedInstallmentIds] = useState<string[]>([]);

  const [openGenerate, setOpenGenerate] = useState(false);
  const [generateForm, setGenerateForm] = useState<GenerateFinancialForm>(emptyGenerateForm);
  const [openCharges, setOpenCharges] = useState(false);
  const [selectedChargesInstallment, setSelectedChargesInstallment] = useState<InstallmentItem | null>(null);
  const [chargesForm, setChargesForm] = useState<ChargesForm>(emptyChargesForm);
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentItem | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(emptyPaymentForm);

  const [openCreateRemittance, setOpenCreateRemittance] = useState(false);
  const [createRemittanceForm, setCreateRemittanceForm] = useState<CreateRemittanceForm>(emptyCreateRemittanceForm);
  const [selectedRemittanceId, setSelectedRemittanceId] = useState<string | null>(null);
  const [openRemittanceDetails, setOpenRemittanceDetails] = useState(false);
  const [openMarkSent, setOpenMarkSent] = useState(false);
  const [markSentForm, setMarkSentForm] = useState<MarkSentForm>(emptyMarkSentForm);
  const [openImportReturn, setOpenImportReturn] = useState(false);
  const [importReturnRows, setImportReturnRows] = useState<ImportReturnLine[]>([]);

  const [openEvents, setOpenEvents] = useState(false);
  const [eventsTitle, setEventsTitle] = useState("Eventos de cobrança");
  const [eventsFilter, setEventsFilter] = useState<{ receivableId?: string; installmentId?: string; remittanceId?: string; saleId?: string }>({});

  const [openReceivableCancel, setOpenReceivableCancel] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<ReceivableItem | null>(null);
  const [receivableCancelForm, setReceivableCancelForm] = useState<ReceivableCancelForm>(emptyReceivableCancelForm);

  const { data: sales = [], isLoading: salesLoading, refetch: refetchSales } = useQuery<SaleItem[]>({
    queryKey: ["/api/sales"],
    retry: false,
    queryFn: async () => (await apiRequest("GET", "/api/sales")).json(),
  });

  const { data: receivables = [], isLoading: receivablesLoading, refetch: refetchReceivables } = useQuery<ReceivableItem[]>({
    queryKey: ["/api/financial/receivables"],
    retry: false,
    queryFn: async () => (await apiRequest("GET", "/api/financial/receivables")).json(),
  });

  const { data: installments = [], isLoading: installmentsLoading, refetch: refetchInstallments } = useQuery<InstallmentItem[]>({
    queryKey: ["/api/financial/installments"],
    retry: false,
    queryFn: async () => (await apiRequest("GET", "/api/financial/installments")).json(),
  });

  const { data: remittances = [], isLoading: remittancesLoading, refetch: refetchRemittances } = useQuery<RemittanceItem[]>({
    queryKey: ["/api/financial/remittances"],
    retry: false,
    queryFn: async () => (await apiRequest("GET", "/api/financial/remittances")).json(),
  });

  const { data: collectionEvents = [], isLoading: eventsLoading, refetch: refetchEvents } = useQuery<CollectionEventItem[]>({
    queryKey: ["/api/financial/collection-events", "global"],
    retry: false,
    queryFn: async () => (await apiRequest("GET", "/api/financial/collection-events?limit=120")).json(),
  });

  const { data: selectedRemittanceDetails, isLoading: remittanceDetailsLoading, refetch: refetchRemittanceDetails } = useQuery<RemittanceDetailsResponse>({
    queryKey: ["/api/financial/remittances", selectedRemittanceId],
    enabled: Boolean(selectedRemittanceId),
    retry: false,
    queryFn: async () => (await apiRequest("GET", `/api/financial/remittances/${selectedRemittanceId}`)).json(),
  });

  const loading = salesLoading || receivablesLoading || installmentsLoading || remittancesLoading;

  const receivablesById = useMemo(() => receivables.reduce<Record<string, ReceivableItem>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {}), [receivables]);

  const selectedSet = useMemo(() => new Set(selectedInstallmentIds), [selectedInstallmentIds]);
  const eligibleSales = useMemo(() => sales.filter((item) => item.status !== "cancelado"), [sales]);
  const selectedSale = useMemo(() => sales.find((item) => item.id === generateForm.saleId) || null, [sales, generateForm.saleId]);

  const billingEntityOptions = useMemo(() => {
    const map = new Map<string, string>();
    [...receivables, ...(installments as any[])].forEach((item: any) => {
      if (item.billingEntityId && item.billingEntityName) map.set(item.billingEntityId, item.billingEntityName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [receivables, installments]);

  const developmentOptions = useMemo(() => {
    const map = new Map<string, string>();
    receivables.forEach((item) => {
      if (item.developmentId && item.developmentName) map.set(item.developmentId, item.developmentName);
    });
    sales.forEach((item) => {
      if (item.developmentId && item.developmentName) map.set(item.developmentId, item.developmentName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [receivables, sales]);

  const filteredInstallments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return installments.filter((item) => {
      const matchesStatus = statusFilter === "ALL" ? true : item.status === statusFilter;
      const receivable = receivablesById[item.receivableId];
      const text = [item.clientName, item.contractNumber, item.installmentLabel, item.billingEntityName, receivable?.developmentName, receivable?.lotCode].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!q || text.includes(q));
    });
  }, [installments, receivablesById, search, statusFilter]);

  const filteredReceivables = useMemo(() => {
    const q = search.trim().toLowerCase();
    return receivables.filter((item) => {
      const matchesStatus = statusFilter === "ALL" ? true : item.status === statusFilter;
      const text = [item.clientName, item.contractNumber, item.billingEntityName, item.developmentName, item.lotCode].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!q || text.includes(q));
    });
  }, [receivables, search, statusFilter]);

  const filteredRemittances = useMemo(() => {
    const q = search.trim().toLowerCase();
    return remittances.filter((item) => {
      const matchesStatus = remittanceFilter === "ALL" ? true : item.status === remittanceFilter;
      const text = [item.billingEntityName, item.developmentName, item.fileName, item.type, item.notes, item.sequenceNumber].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!q || text.includes(q));
    });
  }, [remittances, search, remittanceFilter]);

  const filteredEvents = useMemo(() => {
    return collectionEvents.filter((event) => {
      if (eventsFilter.receivableId && event.receivableId !== eventsFilter.receivableId) return false;
      if (eventsFilter.installmentId && event.installmentId !== eventsFilter.installmentId) return false;
      if (eventsFilter.remittanceId && event.remittanceId !== eventsFilter.remittanceId) return false;
      if (eventsFilter.saleId && event.saleId !== eventsFilter.saleId) return false;
      return true;
    });
  }, [collectionEvents, eventsFilter]);

  const stats = useMemo(() => {
    const receitasPrevistas = receivables.reduce((acc, item) => acc + Number(item.financedAmount || 0), 0);
    const recebido = installments.filter((item) => item.status === "paga").reduce((acc, item) => acc + Number(item.paidValue || 0), 0);
    const emAberto = installments.filter((item) => item.status === "aberta").reduce((acc, item) => acc + Number(item.totalDue || item.nominalValue || 0), 0);
    const inadimplencia = installments.filter((item) => item.status === "atrasada").reduce((acc, item) => acc + Number(item.totalDue || item.nominalValue || 0), 0);
    const remessasAbertas = remittances.filter((item) => ["rascunho", "gerada", "enviada"].includes(item.status)).length;
    return { receitasPrevistas, recebido, emAberto, inadimplencia, overdueCount: installments.filter((item) => item.status === "atrasada").length, totalRemittances: remittances.length, remessasAbertas };
  }, [receivables, installments, remittances]);

  async function refreshFinancialData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/financial/receivables"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/financial/installments"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/financial/remittances"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/financial/collection-events"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] }),
    ]);
    await Promise.all([refetchReceivables(), refetchInstallments(), refetchRemittances(), refetchEvents(), refetchSales()]);
  }

  const generateMutation = useMutation({
    mutationFn: async (payload: { saleId: string; firstDueDate?: string; installmentsCount?: number; installmentValue?: number; billingType: "boleto" | "carne" | "pix" | "outro"; replaceExisting: boolean; }) => {
      const response = await apiRequest("POST", `/api/financial/sales/${payload.saleId}/generate`, {
        firstDueDate: payload.firstDueDate || null,
        installmentsCount: payload.installmentsCount ?? null,
        installmentValue: payload.installmentValue ?? null,
        billingType: payload.billingType,
        replaceExisting: payload.replaceExisting,
      });
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Carteira gerada", description: "As parcelas financeiras foram geradas com sucesso." });
      setOpenGenerate(false);
      setGenerateForm(emptyGenerateForm);
      await refreshFinancialData();
    },
    onError: async (error: any) => {
      const data = error?.response?.json ? await readJson(error.response) : null;
      toast({ title: "Erro ao gerar carteira", description: data?.message || error?.message || "Não foi possível gerar a carteira financeira.", variant: "destructive" });
    },
  });

  const updateChargesMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { discountValue: number; otherDeductionsValue: number; fineValue: number; otherAdditionsValue: number; notes?: string | null } }) => {
      return (await apiRequest("PATCH", `/api/financial/installments/${id}/charges`, payload)).json();
    },
    onSuccess: async () => {
      toast({ title: "Boleto ajustado", description: "Os valores do boleto foram atualizados." });
      setOpenCharges(false);
      setSelectedChargesInstallment(null);
      setChargesForm(emptyChargesForm);
      await refreshFinancialData();
    },
    onError: async (error: any) => {
      const data = error?.response?.json ? await readJson(error.response) : null;
      toast({ title: "Erro ao ajustar boleto", description: data?.message || error?.message || "Não foi possível ajustar o boleto.", variant: "destructive" });
    },
  });

  const payInstallmentMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { discountValue: number; otherDeductionsValue: number; fineValue: number; otherAdditionsValue: number; paidValue: number; paymentDate: string; paymentMethod: string; notes?: string | null } }) => {
      return (await apiRequest("PATCH", `/api/financial/installments/${id}/pay`, payload)).json();
    },
    onSuccess: async () => {
      toast({ title: "Baixa realizada", description: "A parcela foi marcada como paga com sucesso." });
      setOpenPayment(false);
      setSelectedInstallment(null);
      setPaymentForm(emptyPaymentForm);
      await refreshFinancialData();
    },
    onError: async (error: any) => {
      const data = error?.response?.json ? await readJson(error.response) : null;
      toast({ title: "Erro ao dar baixa", description: data?.message || error?.message || "Não foi possível dar baixa na parcela.", variant: "destructive" });
    },
  });

  const cancelReceivableMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { reason?: string | null; requestBankOps: boolean } }) => {
      return (await apiRequest("POST", `/api/financial/receivables/${id}/cancel`, payload)).json();
    },
    onSuccess: async (data: any) => {
      toast({ title: "Recebível cancelado", description: data?.bankRequests > 0 ? `Financeiro cancelado e ${data.bankRequests} solicitação(ões) bancária(s) preparadas.` : "O recebível e suas parcelas foram cancelados com sucesso." });
      setOpenReceivableCancel(false);
      setSelectedReceivable(null);
      setReceivableCancelForm(emptyReceivableCancelForm);
      await refreshFinancialData();
    },
    onError: async (error: any) => {
      const data = error?.response?.json ? await readJson(error.response) : null;
      toast({ title: "Erro ao cancelar recebível", description: data?.message || error?.message || "Não foi possível cancelar o recebível.", variant: "destructive" });
    },
  });

  const createRemittanceMutation = useMutation({
    mutationFn: async (payload: { type: RemittanceType; billingEntityId?: string | null; billingEntityName?: string | null; developmentId?: string | null; developmentName?: string | null; notes?: string | null }) => {
      return (await apiRequest("POST", "/api/financial/remittances", payload)).json();
    },
  });

  const addRemittanceItemsMutation = useMutation({
    mutationFn: async ({ remittanceId, payload }: { remittanceId: string; payload: { installmentIds?: string[]; receivableId?: string | null; saleId?: string | null; onlyEligible: boolean } }) => {
      return (await apiRequest("POST", `/api/financial/remittances/${remittanceId}/add-items`, payload)).json();
    },
  });

  const generateCnabMutation = useMutation({
    mutationFn: async (remittanceId: string) => (await apiRequest("POST", `/api/financial/remittances/${remittanceId}/generate-cnab240`, {})).json(),
    onSuccess: async (data: any) => {
      toast({ title: "Arquivo de remessa gerado", description: data?.message || "A prévia operacional da remessa foi gerada." });
      await refreshFinancialData();
      if (selectedRemittanceId) await refetchRemittanceDetails();
    },
    onError: async (error: any) => {
      const data = error?.response?.json ? await readJson(error.response) : null;
      toast({ title: "Erro ao gerar remessa", description: data?.message || error?.message || "Não foi possível gerar o arquivo da remessa.", variant: "destructive" });
    },
  });

  const markSentMutation = useMutation({
    mutationFn: async ({ remittanceId, payload }: { remittanceId: string; payload: MarkSentForm }) => (await apiRequest("POST", `/api/financial/remittances/${remittanceId}/mark-sent`, payload)).json(),
    onSuccess: async () => {
      toast({ title: "Remessa enviada", description: "A remessa foi marcada como enviada ao banco." });
      setOpenMarkSent(false);
      setMarkSentForm(emptyMarkSentForm);
      await refreshFinancialData();
      if (selectedRemittanceId) await refetchRemittanceDetails();
    },
    onError: async (error: any) => {
      const data = error?.response?.json ? await readJson(error.response) : null;
      toast({ title: "Erro ao marcar remessa", description: data?.message || error?.message || "Não foi possível marcar a remessa como enviada.", variant: "destructive" });
    },
  });

  const importReturnMutation = useMutation({
    mutationFn: async ({ remittanceId, items }: { remittanceId: string; items: any[] }) => (await apiRequest("POST", `/api/financial/remittances/${remittanceId}/import-return`, { items })).json(),
    onSuccess: async (data: any) => {
      toast({ title: "Retorno importado", description: data?.message || "O retorno bancário foi importado com sucesso." });
      setOpenImportReturn(false);
      setImportReturnRows([]);
      await refreshFinancialData();
      if (selectedRemittanceId) await refetchRemittanceDetails();
    },
    onError: async (error: any) => {
      const data = error?.response?.json ? await readJson(error.response) : null;
      toast({ title: "Erro ao importar retorno", description: data?.message || error?.message || "Não foi possível importar o retorno bancário.", variant: "destructive" });
    },
  });

  function toggleInstallmentSelection(id: string) {
    setSelectedInstallmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function toggleSelectVisibleInstallments() {
    const visibleIds = filteredInstallments.map((item) => item.id);
    const everyVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));

    setSelectedInstallmentIds((prev) => {
      const set = new Set(prev);
      if (everyVisibleSelected) {
        visibleIds.forEach((id) => set.delete(id));
      } else {
        visibleIds.forEach((id) => set.add(id));
      }
      return Array.from(set);
    });
  }

  function openChargesDialog(installment: InstallmentItem) {
    setSelectedChargesInstallment(installment);
    setChargesForm({
      discountValue: String(installment.discountValue || 0),
      otherDeductionsValue: String(installment.otherDeductionsValue || 0),
      fineValue: String(installment.fineValue || 0),
      otherAdditionsValue: String(installment.otherAdditionsValue || 0),
      notes: installment.notes || "",
    });
    setOpenCharges(true);
  }

  function openPaymentDialog(installment: InstallmentItem) {
    setSelectedInstallment(installment);
    setPaymentForm({
      discountValue: String(installment.discountValue || 0),
      otherDeductionsValue: String(installment.otherDeductionsValue || 0),
      fineValue: String(installment.fineValue || 0),
      otherAdditionsValue: String(installment.otherAdditionsValue || 0),
      paidValue: String(installment.totalDue || installment.nominalValue || 0),
      paymentDate: today,
      paymentMethod: installment.paymentMethod || "boleto",
      notes: installment.notes || "",
    });
    setOpenPayment(true);
  }

  function handlePrintInstallment(installment: InstallmentItem) {
    const receivable = receivablesById[installment.receivableId] || null;
    const html = buildPrintableBoletoHtml(installment, receivable);
    const printWindow = window.open("", "_blank", "width=1100,height=900");
    if (!printWindow) {
      toast({ title: "Janela bloqueada", description: "O navegador bloqueou a abertura da janela de impressão. Libere pop-ups para continuar.", variant: "destructive" });
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  function handleGenerateFinancial() {
    if (generateForm.saleId === "NONE") {
      toast({ title: "Venda obrigatória", description: "Selecione uma venda para gerar a carteira financeira.", variant: "destructive" });
      return;
    }
    generateMutation.mutate({
      saleId: generateForm.saleId,
      firstDueDate: generateForm.firstDueDate || undefined,
      installmentsCount: generateForm.installmentsCount ? Number(generateForm.installmentsCount) : undefined,
      installmentValue: generateForm.installmentValue ? toNumber(generateForm.installmentValue) : undefined,
      billingType: generateForm.billingType,
      replaceExisting: generateForm.replaceExisting,
    });
  }

  function handleSaveCharges() {
    if (!selectedChargesInstallment) return;
    updateChargesMutation.mutate({
      id: selectedChargesInstallment.id,
      payload: {
        discountValue: toNumber(chargesForm.discountValue),
        otherDeductionsValue: toNumber(chargesForm.otherDeductionsValue),
        fineValue: toNumber(chargesForm.fineValue),
        otherAdditionsValue: toNumber(chargesForm.otherAdditionsValue),
        notes: chargesForm.notes || null,
      },
    });
  }

  function handlePayInstallment() {
    if (!selectedInstallment) return;
    payInstallmentMutation.mutate({
      id: selectedInstallment.id,
      payload: {
        discountValue: toNumber(paymentForm.discountValue),
        otherDeductionsValue: toNumber(paymentForm.otherDeductionsValue),
        fineValue: toNumber(paymentForm.fineValue),
        otherAdditionsValue: toNumber(paymentForm.otherAdditionsValue),
        paidValue: toNumber(paymentForm.paidValue),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes || null,
      },
    });
  }

  async function handleCreateRemittance() {
    if (createRemittanceForm.sourceMode === "selected" && selectedInstallmentIds.length === 0) {
      toast({ title: "Seleção obrigatória", description: "Selecione pelo menos uma parcela para montar a remessa.", variant: "destructive" });
      return;
    }
    if (createRemittanceForm.sourceMode === "receivable" && createRemittanceForm.receivableId === "ALL") {
      toast({ title: "Recebível obrigatório", description: "Selecione um recebível para montar a remessa.", variant: "destructive" });
      return;
    }
    if (createRemittanceForm.sourceMode === "sale" && createRemittanceForm.saleId === "ALL") {
      toast({ title: "Venda obrigatória", description: "Selecione uma venda para montar a remessa.", variant: "destructive" });
      return;
    }

    try {
      const selectedBilling = billingEntityOptions.find((item) => item.id === createRemittanceForm.billingEntityId);
      const selectedDevelopment = developmentOptions.find((item) => item.id === createRemittanceForm.developmentId);
      const created = await createRemittanceMutation.mutateAsync({
        type: createRemittanceForm.type,
        billingEntityId: createRemittanceForm.billingEntityId !== "ALL" ? createRemittanceForm.billingEntityId : null,
        billingEntityName: createRemittanceForm.billingEntityId !== "ALL" ? selectedBilling?.name || null : null,
        developmentId: createRemittanceForm.developmentId !== "ALL" ? createRemittanceForm.developmentId : null,
        developmentName: createRemittanceForm.developmentId !== "ALL" ? selectedDevelopment?.name || null : null,
        notes: createRemittanceForm.notes || null,
      });
      const remittanceId = created?.id;
      await addRemittanceItemsMutation.mutateAsync({
        remittanceId,
        payload: {
          installmentIds: createRemittanceForm.sourceMode === "selected" ? selectedInstallmentIds : undefined,
          receivableId: createRemittanceForm.sourceMode === "receivable" && createRemittanceForm.receivableId !== "ALL" ? createRemittanceForm.receivableId : null,
          saleId: createRemittanceForm.sourceMode === "sale" && createRemittanceForm.saleId !== "ALL" ? createRemittanceForm.saleId : null,
          onlyEligible: createRemittanceForm.onlyEligible,
        },
      });
      if (createRemittanceForm.autoGenerate) {
        await generateCnabMutation.mutateAsync(remittanceId);
      }
      toast({ title: "Remessa preparada", description: "Remessa criada com os itens selecionados." });
      setOpenCreateRemittance(false);
      setCreateRemittanceForm(emptyCreateRemittanceForm);
      setSelectedInstallmentIds([]);
      setActiveView("remittances");
      setSelectedRemittanceId(remittanceId);
      setOpenRemittanceDetails(true);
      await refreshFinancialData();
    } catch (error: any) {
      const data = error?.response?.json ? await readJson(error.response) : null;
      toast({ title: "Erro ao preparar remessa", description: data?.message || error?.message || "Não foi possível criar a remessa.", variant: "destructive" });
    }
  }

  async function handleDownloadRemittance(remittanceId: string) {
    try {
      const response = await fetch(`/api/financial/remittances/${remittanceId}/download`, { credentials: "include" });
      if (!response.ok) {
        const data = response.headers.get("content-type")?.includes("application/json") ? await response.json() : null;
        throw new Error(data?.message || "Não foi possível baixar o arquivo da remessa.");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const filename = disposition.match(/filename="?([^"]+)"?/)?.[1] || `remessa-${remittanceId}.txt`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: "Erro ao baixar remessa", description: error?.message || "Não foi possível baixar o arquivo.", variant: "destructive" });
    }
  }

  const chargesPreviewTotal = selectedChargesInstallment ? calculateChargedValueFromForm(selectedChargesInstallment.nominalValue, chargesForm) : 0;
  const paymentPreviewTotal = selectedInstallment ? calculateChargedValueFromForm(selectedInstallment.nominalValue, paymentForm) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">ERP Financeiro / Cobrança</h1>
          <p className="text-slate-500">Contas a receber, parcelas, boletos, remessas e retorno bancário a partir das vendas reais.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="gap-2 bg-white" onClick={refreshFinancialData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="outline" className="gap-2 bg-white" onClick={() => setOpenCreateRemittance(true)}>
            <FileCode2 className="h-4 w-4" />
            Nova Remessa
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setOpenGenerate(true)}>
            <FilePlus2 className="h-4 w-4" />
            Gerar Carteira
          </Button>
        </div>
      </div>

      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Landmark className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg font-black text-slate-900">Financeiro conectado ao banco de dados</div>
                <Badge variant="secondary">Real</Badge>
                <Badge variant="outline">Remessas</Badge>
              </div>
              <div className="mt-1 text-slate-700">Esta versão já consome recebíveis persistidos, gera parcelas, ajusta boleto, baixa manualmente, cria remessas, gera prévia de arquivo, marca envio e importa retorno operacional.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white"><CardContent className="p-5"><div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Receitas Previstas</div><div className="mt-2 text-2xl font-black text-emerald-700">{formatCurrency(stats.receitasPrevistas)}</div></CardContent></Card>
        <Card className="border-slate-200 shadow-sm bg-white"><CardContent className="p-5"><div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recebido</div><div className="mt-2 text-2xl font-black text-blue-700">{formatCurrency(stats.recebido)}</div></CardContent></Card>
        <Card className="border-slate-200 shadow-sm bg-white"><CardContent className="p-5"><div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saldo em Aberto</div><div className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(stats.emAberto)}</div></CardContent></Card>
        <Card className="border-amber-200 shadow-sm bg-amber-50"><CardContent className="p-5"><div className="text-xs font-semibold uppercase tracking-wider text-amber-700">Inadimplência</div><div className="mt-2 text-2xl font-black text-amber-700">{formatCurrency(stats.inadimplencia)}</div><div className="mt-1 text-xs text-amber-700/80">{stats.overdueCount} parcela(s) atrasada(s)</div></CardContent></Card>
        <Card className="border-purple-200 shadow-sm bg-purple-50"><CardContent className="p-5"><div className="text-xs font-semibold uppercase tracking-wider text-purple-700">Remessas ativas</div><div className="mt-2 text-2xl font-black text-purple-700">{stats.remessasAbertas}</div><div className="mt-1 text-xs text-purple-700/80">{stats.totalRemittances} no total</div></CardContent></Card>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white"><CardContent className="p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2"><Button variant={activeView === "installments" ? "default" : "outline"} className="gap-2" onClick={() => setActiveView("installments")}><Receipt className="h-4 w-4" />Parcelas</Button><Button variant={activeView === "receivables" ? "default" : "outline"} className="gap-2" onClick={() => setActiveView("receivables")}><DollarSign className="h-4 w-4" />Recebíveis</Button><Button variant={activeView === "remittances" ? "default" : "outline"} className="gap-2" onClick={() => setActiveView("remittances")}><FileCode2 className="h-4 w-4" />Remessas</Button><Button variant="outline" className="gap-2" onClick={() => { setEventsTitle("Últimos eventos de cobrança"); setEventsFilter({}); setOpenEvents(true); }}><Eye className="h-4 w-4" />Eventos</Button></div><div className="flex flex-col sm:flex-row gap-2"><div className="relative w-full sm:w-[320px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Buscar contrato, cliente, remessa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white" /></div>{activeView === "remittances" ? (<Select value={remittanceFilter} onValueChange={setRemittanceFilter}><SelectTrigger className="w-full sm:w-[180px] bg-white"><SelectValue placeholder="Filtrar status" /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="rascunho">Rascunho</SelectItem><SelectItem value="gerada">Gerada</SelectItem><SelectItem value="enviada">Enviada</SelectItem><SelectItem value="processada">Processada</SelectItem><SelectItem value="erro">Erro</SelectItem></SelectContent></Select>) : (<Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px] bg-white"><SelectValue placeholder="Filtrar status" /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="aberta">Abertas</SelectItem><SelectItem value="paga">Pagas</SelectItem><SelectItem value="atrasada">Atrasadas</SelectItem><SelectItem value="cancelada">Canceladas</SelectItem><SelectItem value="aberto">Recebível aberto</SelectItem><SelectItem value="parcial">Recebível parcial</SelectItem><SelectItem value="quitado">Recebível quitado</SelectItem><SelectItem value="cancelado">Recebível cancelado</SelectItem></SelectContent></Select>)}</div></CardContent></Card>

      {activeView === "installments" && <Card className="border-slate-200 shadow-sm bg-white"><CardHeader><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg"><Receipt className="h-5 w-5 text-emerald-600" />Lançamentos Financeiros</CardTitle><CardDescription>Parcelas prontas para cobrança, baixa ou remessa bancária.</CardDescription></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="gap-2 bg-white" onClick={toggleSelectVisibleInstallments}><CheckCircle2 className="h-4 w-4" />{filteredInstallments.length > 0 && filteredInstallments.every((item) => selectedSet.has(item.id)) ? "Desmarcar visíveis" : "Selecionar visíveis"}</Button><Button variant="outline" className="gap-2 bg-white" onClick={() => setOpenCreateRemittance(true)}><BanknoteArrowUp className="h-4 w-4" />Remeter selecionadas ({selectedInstallmentIds.length})</Button></div></div></CardHeader><CardContent className="p-0">{loading ? <div className="p-10 flex items-center justify-center text-slate-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Carregando financeiro...</div> : filteredInstallments.length === 0 ? <div className="p-12 text-center text-slate-500">Nenhuma parcela financeira encontrada.</div> : <div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50/80"><TableRow><TableHead className="w-[40px]">Sel.</TableHead><TableHead>Contrato</TableHead><TableHead>Cliente</TableHead><TableHead>Parcela</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{filteredInstallments.map((item) => { const receivable = receivablesById[item.receivableId]; return <TableRow key={item.id}><TableCell><input type="checkbox" checked={selectedSet.has(item.id)} onChange={() => toggleInstallmentSelection(item.id)} /></TableCell><TableCell><div className="font-medium">{item.contractNumber}</div><div className="text-xs text-slate-500">{item.billingEntityName || "Sem entidade"}</div></TableCell><TableCell><div>{item.clientName}</div><div className="text-xs text-slate-500">{receivable?.developmentName || "-"} • {receivable?.lotCode || "-"}</div></TableCell><TableCell><div className="font-medium">{item.installmentLabel}</div><div className="text-xs text-slate-500">#{item.installmentNumber}</div></TableCell><TableCell>{formatDate(item.dueDate)}</TableCell><TableCell><div className="font-medium">{formatCurrency(item.totalDue || item.nominalValue)}</div><div className="text-xs text-slate-500">Documento: {formatCurrency(item.nominalValue)}</div></TableCell><TableCell><Badge variant={statusBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge></TableCell><TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" className="gap-2" onClick={() => openChargesDialog(item)} disabled={item.status === "paga" || item.status === "cancelada"}><Pencil className="h-4 w-4" />Ajustar boleto</Button><Button variant="outline" size="sm" className="gap-2" onClick={() => handlePrintInstallment(item)}><Printer className="h-4 w-4" />Imprimir / PDF</Button><Button variant="outline" size="sm" className="gap-2" onClick={() => openPaymentDialog(item)} disabled={item.status === "paga" || item.status === "cancelada"}><Wallet className="h-4 w-4" />Dar baixa</Button><Button variant="outline" size="sm" className="gap-2" onClick={() => { setEventsTitle(`Eventos da parcela ${item.installmentLabel}`); setEventsFilter({ installmentId: item.id }); setOpenEvents(true); }}><Eye className="h-4 w-4" />Eventos</Button></div></TableCell></TableRow>; })}</TableBody></Table></div>}</CardContent></Card>}

      {activeView === "receivables" && <Card className="border-slate-200 shadow-sm bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><DollarSign className="h-5 w-5 text-blue-600" />Recebíveis em carteira</CardTitle><CardDescription>Consolidação por contrato com visão de saldo, status e cancelamento financeiro.</CardDescription></CardHeader><CardContent className="p-0">{loading ? <div className="p-10 flex items-center justify-center text-slate-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Carregando recebíveis...</div> : filteredReceivables.length === 0 ? <div className="p-12 text-center text-slate-500">Nenhum recebível encontrado.</div> : <div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50/80"><TableRow><TableHead>Contrato</TableHead><TableHead>Cliente</TableHead><TableHead>Empreendimento</TableHead><TableHead>Saldo</TableHead><TableHead>Parcelas</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{filteredReceivables.map((item) => <TableRow key={item.id}><TableCell><div className="font-medium">{item.contractNumber}</div><div className="text-xs text-slate-500">{item.billingEntityName || "Sem entidade"}</div></TableCell><TableCell>{item.clientName}</TableCell><TableCell><div>{item.developmentName || "-"}</div><div className="text-xs text-slate-500">Lote {item.lotCode || "-"}</div></TableCell><TableCell>{formatCurrency(item.financedAmount || 0)}</TableCell><TableCell><div>{item.installmentsCount} parcela(s)</div><div className="text-xs text-slate-500">1º venc.: {formatDate(item.firstDueDate)}</div></TableCell><TableCell><Badge variant={statusBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge></TableCell><TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" className="gap-2" onClick={() => { setSearch(item.contractNumber); setActiveView("installments"); }}><Eye className="h-4 w-4" />Ver parcelas</Button><Button variant="outline" size="sm" className="gap-2" onClick={() => { setEventsTitle(`Eventos do recebível ${item.contractNumber}`); setEventsFilter({ receivableId: item.id }); setOpenEvents(true); }}><CalendarClock className="h-4 w-4" />Eventos</Button><Button variant="outline" size="sm" className="gap-2 text-rose-600" onClick={() => { setSelectedReceivable(item); setReceivableCancelForm(emptyReceivableCancelForm); setOpenReceivableCancel(true); }} disabled={item.status === "cancelado" || item.status === "quitado"}><XCircle className="h-4 w-4" />Cancelar financeiro</Button></div></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>}

      {activeView === "remittances" && <Card className="border-slate-200 shadow-sm bg-white"><CardHeader><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg"><FileCode2 className="h-5 w-5 text-purple-600" />Remessas e retorno bancário</CardTitle><CardDescription>Criação, geração, envio e processamento operacional das remessas.</CardDescription></div><Button className="gap-2" onClick={() => setOpenCreateRemittance(true)}><FilePlus2 className="h-4 w-4" />Nova remessa</Button></div></CardHeader><CardContent className="p-0">{loading ? <div className="p-10 flex items-center justify-center text-slate-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Carregando remessas...</div> : filteredRemittances.length === 0 ? <div className="p-12 text-center text-slate-500">Nenhuma remessa encontrada.</div> : <div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50/80"><TableRow><TableHead>Tipo</TableHead><TableHead>Entidade / Empreendimento</TableHead><TableHead>Sequência</TableHead><TableHead>Itens</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{filteredRemittances.map((item) => <TableRow key={item.id}><TableCell><div className="font-medium">{remittanceTypeLabel(item.type)}</div><div className="text-xs text-slate-500">Banco {item.bankCode || "756"}</div></TableCell><TableCell><div>{item.billingEntityName || "Sem entidade"}</div><div className="text-xs text-slate-500">{item.developmentName || "Todos os empreendimentos"}</div></TableCell><TableCell><div className="font-medium">#{item.sequenceNumber}</div><div className="text-xs text-slate-500">{item.fileName || "Arquivo ainda não gerado"}</div></TableCell><TableCell>{item.itemsCount}</TableCell><TableCell>{formatCurrency(item.totalAmount || 0)}</TableCell><TableCell><Badge variant={statusBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge></TableCell><TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" className="gap-2" onClick={() => { setSelectedRemittanceId(item.id); setOpenRemittanceDetails(true); }}><Eye className="h-4 w-4" />Abrir</Button><Button variant="outline" size="sm" className="gap-2" onClick={() => generateCnabMutation.mutate(item.id)} disabled={generateCnabMutation.isPending || item.itemsCount === 0}><FileCode2 className="h-4 w-4" />Gerar</Button><Button variant="outline" size="sm" className="gap-2" onClick={() => handleDownloadRemittance(item.id)} disabled={!item.hasGeneratedContent}><BanknoteArrowDown className="h-4 w-4" />Baixar</Button><Button variant="outline" size="sm" className="gap-2" onClick={() => { setSelectedRemittanceId(item.id); setMarkSentForm({ sentAt: today, fileName: item.fileName || `REMESSA_${String(item.sequenceNumber).padStart(6, "0")}.txt`, notes: item.notes || "" }); setOpenMarkSent(true); }} disabled={!item.hasGeneratedContent}><Send className="h-4 w-4" />Enviar</Button></div></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>}

      <Card className="border-slate-200 shadow-sm bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CalendarClock className="h-5 w-5 text-blue-600" />Resumo operacional</CardTitle><CardDescription>Situação consolidada do módulo financeiro e cobrança.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm"><div className="rounded-lg border bg-slate-50 p-4"><div className="text-slate-500">Carteiras geradas</div><div className="mt-1 text-2xl font-black text-slate-900">{receivables.length}</div></div><div className="rounded-lg border bg-slate-50 p-4"><div className="text-slate-500">Parcelas geradas</div><div className="mt-1 text-2xl font-black text-slate-900">{installments.length}</div></div><div className="rounded-lg border bg-slate-50 p-4"><div className="text-slate-500">Remessas registradas</div><div className="mt-1 text-2xl font-black text-slate-900">{remittances.length}</div></div><div className="rounded-lg border bg-amber-50 border-amber-200 p-4"><div className="text-amber-700 font-semibold">Boleto A5 / meia A4</div><div className="mt-1 text-amber-700/80">O layout de impressão foi ajustado para A5 em paisagem, com linha digitável e código de barras preservados.</div></div></CardContent></Card>

      <Dialog open={openGenerate} onOpenChange={setOpenGenerate}><DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Gerar carteira financeira</DialogTitle><DialogDescription>Gere as parcelas mensais a partir de uma venda já cadastrada.</DialogDescription></DialogHeader><div className="grid gap-5 py-2"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label>Venda *</Label><Select value={generateForm.saleId} onValueChange={(value) => setGenerateForm((prev) => ({ ...prev, saleId: value }))}><SelectTrigger><SelectValue placeholder="Selecione a venda" /></SelectTrigger><SelectContent className="max-h-[280px]"><SelectItem value="NONE">Selecione...</SelectItem>{eligibleSales.map((sale) => <SelectItem key={sale.id} value={sale.id}>{sale.contractNumber} • {sale.clientName} • {sale.lotCode}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Primeiro vencimento</Label><Input type="date" value={generateForm.firstDueDate} onChange={(e) => setGenerateForm((prev) => ({ ...prev, firstDueDate: e.target.value }))} /></div><div className="space-y-2"><Label>Tipo de cobrança</Label><Select value={generateForm.billingType} onValueChange={(value: "boleto" | "carne" | "pix" | "outro") => setGenerateForm((prev) => ({ ...prev, billingType: value }))}><SelectTrigger><SelectValue placeholder="Tipo de cobrança" /></SelectTrigger><SelectContent><SelectItem value="boleto">Boleto</SelectItem><SelectItem value="carne">Carnê</SelectItem><SelectItem value="pix">PIX</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Quantidade de parcelas</Label><Input type="number" value={generateForm.installmentsCount} onChange={(e) => setGenerateForm((prev) => ({ ...prev, installmentsCount: e.target.value }))} /></div><div className="space-y-2"><Label>Valor da parcela</Label><Input type="number" step="0.01" value={generateForm.installmentValue} onChange={(e) => setGenerateForm((prev) => ({ ...prev, installmentValue: e.target.value }))} /></div></div>{selectedSale && <Card className="border-slate-200 bg-slate-50"><CardContent className="p-4 grid gap-3 md:grid-cols-4 text-sm"><div><div className="text-slate-500">Contrato</div><div className="font-bold text-slate-900">{selectedSale.contractNumber}</div></div><div><div className="text-slate-500">Cliente</div><div className="font-bold text-slate-900">{selectedSale.clientName}</div></div><div><div className="text-slate-500">Saldo financiado</div><div className="font-bold text-slate-900">{formatCurrency(selectedSale.financedAmount)}</div></div><div><div className="text-slate-500">1ª parcela atual</div><div className="font-bold text-emerald-700">{formatCurrency(selectedSale.firstInstallment)}</div></div></CardContent></Card>}<div className="flex items-center gap-2"><input id="replaceExisting" type="checkbox" checked={generateForm.replaceExisting} onChange={(e) => setGenerateForm((prev) => ({ ...prev, replaceExisting: e.target.checked }))} /><Label htmlFor="replaceExisting" className="cursor-pointer">Recriar carteira existente</Label></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setOpenGenerate(false); setGenerateForm(emptyGenerateForm); }}>Cancelar</Button><Button onClick={handleGenerateFinancial} disabled={generateMutation.isPending}>{generateMutation.isPending ? "Gerando..." : "Gerar carteira"}</Button></div></div></DialogContent></Dialog>

      <Dialog open={openCharges} onOpenChange={setOpenCharges}><DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Ajustar boleto</DialogTitle><DialogDescription>Ajuste os valores exatamente no padrão do boleto do banco.</DialogDescription></DialogHeader><div className="grid gap-5 py-2">{selectedChargesInstallment && <Card className="border-slate-200 bg-slate-50"><CardContent className="p-4 grid gap-3 md:grid-cols-4 text-sm"><div><div className="text-slate-500">Contrato</div><div className="font-bold text-slate-900">{selectedChargesInstallment.contractNumber}</div></div><div><div className="text-slate-500">Parcela</div><div className="font-bold text-slate-900">{selectedChargesInstallment.installmentLabel}</div></div><div><div className="text-slate-500">Valor documento</div><div className="font-bold text-slate-900">{formatCurrency(selectedChargesInstallment.nominalValue)}</div></div><div><div className="text-slate-500">Valor cobrado</div><div className="font-bold text-emerald-700">{formatCurrency(chargesPreviewTotal)}</div></div></CardContent></Card>}<div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>(-) Desconto / Abatimento</Label><Input type="number" step="0.01" value={chargesForm.discountValue} onChange={(e) => setChargesForm((prev) => ({ ...prev, discountValue: e.target.value }))} /></div><div className="space-y-2"><Label>(-) Outras deduções</Label><Input type="number" step="0.01" value={chargesForm.otherDeductionsValue} onChange={(e) => setChargesForm((prev) => ({ ...prev, otherDeductionsValue: e.target.value }))} /></div><div className="space-y-2"><Label>(+) Mora / Multa</Label><Input type="number" step="0.01" value={chargesForm.fineValue} onChange={(e) => setChargesForm((prev) => ({ ...prev, fineValue: e.target.value }))} /></div><div className="space-y-2"><Label>(+) Outros acréscimos</Label><Input type="number" step="0.01" value={chargesForm.otherAdditionsValue} onChange={(e) => setChargesForm((prev) => ({ ...prev, otherAdditionsValue: e.target.value }))} /></div><div className="space-y-2 md:col-span-2"><Label>Observações</Label><Textarea rows={4} value={chargesForm.notes} onChange={(e) => setChargesForm((prev) => ({ ...prev, notes: e.target.value }))} /></div></div><div className="flex justify-between gap-2"><Button variant="outline" className="gap-2" onClick={() => selectedChargesInstallment && handlePrintInstallment({ ...selectedChargesInstallment, discountValue: toNumber(chargesForm.discountValue), otherDeductionsValue: toNumber(chargesForm.otherDeductionsValue), fineValue: toNumber(chargesForm.fineValue), otherAdditionsValue: toNumber(chargesForm.otherAdditionsValue), notes: chargesForm.notes, totalDue: chargesPreviewTotal })}><Printer className="h-4 w-4" />Prévia / PDF</Button><div className="flex gap-2"><Button variant="outline" onClick={() => { setOpenCharges(false); setSelectedChargesInstallment(null); setChargesForm(emptyChargesForm); }}>Cancelar</Button><Button onClick={handleSaveCharges} disabled={updateChargesMutation.isPending}>{updateChargesMutation.isPending ? "Salvando..." : "Salvar ajustes"}</Button></div></div></div></DialogContent></Dialog>

      <Dialog open={openPayment} onOpenChange={setOpenPayment}><DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Dar baixa na parcela</DialogTitle><DialogDescription>Registre o pagamento da parcela selecionada.</DialogDescription></DialogHeader><div className="grid gap-5 py-2">{selectedInstallment && <Card className="border-slate-200 bg-slate-50"><CardContent className="p-4 grid gap-3 md:grid-cols-4 text-sm"><div><div className="text-slate-500">Contrato</div><div className="font-bold text-slate-900">{selectedInstallment.contractNumber}</div></div><div><div className="text-slate-500">Cliente</div><div className="font-bold text-slate-900">{selectedInstallment.clientName}</div></div><div><div className="text-slate-500">Parcela</div><div className="font-bold text-slate-900">{selectedInstallment.installmentLabel}</div></div><div><div className="text-slate-500">Valor cobrado</div><div className="font-bold text-emerald-700">{formatCurrency(paymentPreviewTotal)}</div></div></CardContent></Card>}<div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>(-) Desconto / Abatimento</Label><Input type="number" step="0.01" value={paymentForm.discountValue} onChange={(e) => setPaymentForm((prev) => ({ ...prev, discountValue: e.target.value }))} /></div><div className="space-y-2"><Label>(-) Outras deduções</Label><Input type="number" step="0.01" value={paymentForm.otherDeductionsValue} onChange={(e) => setPaymentForm((prev) => ({ ...prev, otherDeductionsValue: e.target.value }))} /></div><div className="space-y-2"><Label>(+) Mora / Multa</Label><Input type="number" step="0.01" value={paymentForm.fineValue} onChange={(e) => setPaymentForm((prev) => ({ ...prev, fineValue: e.target.value }))} /></div><div className="space-y-2"><Label>(+) Outros acréscimos</Label><Input type="number" step="0.01" value={paymentForm.otherAdditionsValue} onChange={(e) => setPaymentForm((prev) => ({ ...prev, otherAdditionsValue: e.target.value }))} /></div><div className="space-y-2"><Label>Valor pago</Label><Input type="number" step="0.01" value={paymentForm.paidValue} onChange={(e) => setPaymentForm((prev) => ({ ...prev, paidValue: e.target.value }))} /></div><div className="space-y-2"><Label>Data do pagamento</Label><Input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))} /></div><div className="space-y-2"><Label>Forma de pagamento</Label><Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, paymentMethod: value }))}><SelectTrigger><SelectValue placeholder="Forma de pagamento" /></SelectTrigger><SelectContent><SelectItem value="boleto">Boleto</SelectItem><SelectItem value="pix">PIX</SelectItem><SelectItem value="transferencia">Transferência</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem><SelectItem value="cartao">Cartão</SelectItem><SelectItem value="manual">Manual</SelectItem></SelectContent></Select></div><div className="space-y-2 md:col-span-2"><Label>Observações</Label><Textarea rows={4} value={paymentForm.notes} onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))} /></div></div><div className="flex justify-between gap-2"><Button variant="outline" className="gap-2" onClick={() => selectedInstallment && handlePrintInstallment({ ...selectedInstallment, discountValue: toNumber(paymentForm.discountValue), otherDeductionsValue: toNumber(paymentForm.otherDeductionsValue), fineValue: toNumber(paymentForm.fineValue), otherAdditionsValue: toNumber(paymentForm.otherAdditionsValue), notes: paymentForm.notes, totalDue: paymentPreviewTotal })}><Printer className="h-4 w-4" />Imprimir / PDF</Button><div className="flex gap-2"><Button variant="outline" onClick={() => { setOpenPayment(false); setSelectedInstallment(null); setPaymentForm(emptyPaymentForm); }}>Cancelar</Button><Button onClick={handlePayInstallment} disabled={payInstallmentMutation.isPending}>{payInstallmentMutation.isPending ? "Processando..." : "Confirmar baixa"}</Button></div></div></div></DialogContent></Dialog>

      <Dialog open={openCreateRemittance} onOpenChange={setOpenCreateRemittance}><DialogContent className="sm:max-w-[860px] max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova remessa</DialogTitle><DialogDescription>Monte uma remessa de entrada, baixa ou cancelamento usando parcelas selecionadas, um recebível ou uma venda.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><div className="space-y-2"><Label>Tipo da remessa</Label><Select value={createRemittanceForm.type} onValueChange={(value: RemittanceType) => setCreateRemittanceForm((prev) => ({ ...prev, type: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="baixa">Baixa</SelectItem><SelectItem value="cancelamento">Cancelamento</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Entidade cobradora</Label><Select value={createRemittanceForm.billingEntityId} onValueChange={(value) => setCreateRemittanceForm((prev) => ({ ...prev, billingEntityId: value }))}><SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger><SelectContent><SelectItem value="ALL">Todas</SelectItem>{billingEntityOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Empreendimento</Label><Select value={createRemittanceForm.developmentId} onValueChange={(value) => setCreateRemittanceForm((prev) => ({ ...prev, developmentId: value }))}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem>{developmentOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div></div><div className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>Origem</Label><Select value={createRemittanceForm.sourceMode} onValueChange={(value: "selected" | "receivable" | "sale") => setCreateRemittanceForm((prev) => ({ ...prev, sourceMode: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="selected">Parcelas selecionadas ({selectedInstallmentIds.length})</SelectItem><SelectItem value="receivable">Um recebível</SelectItem><SelectItem value="sale">Uma venda</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Recebível</Label><Select value={createRemittanceForm.receivableId} onValueChange={(value) => setCreateRemittanceForm((prev) => ({ ...prev, receivableId: value }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent className="max-h-[280px]"><SelectItem value="ALL">Selecione...</SelectItem>{receivables.map((item) => <SelectItem key={item.id} value={item.id}>{item.contractNumber} • {item.clientName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Venda</Label><Select value={createRemittanceForm.saleId} onValueChange={(value) => setCreateRemittanceForm((prev) => ({ ...prev, saleId: value }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent className="max-h-[280px]"><SelectItem value="ALL">Selecione...</SelectItem>{sales.map((item) => <SelectItem key={item.id} value={item.id}>{item.contractNumber} • {item.clientName}</SelectItem>)}</SelectContent></Select></div></div><div className="grid gap-4 md:grid-cols-2"><div className="flex items-center gap-2"><input id="onlyEligible" type="checkbox" checked={createRemittanceForm.onlyEligible} onChange={(e) => setCreateRemittanceForm((prev) => ({ ...prev, onlyEligible: e.target.checked }))} /><Label htmlFor="onlyEligible" className="cursor-pointer">Incluir apenas itens elegíveis</Label></div><div className="flex items-center gap-2"><input id="autoGenerate" type="checkbox" checked={createRemittanceForm.autoGenerate} onChange={(e) => setCreateRemittanceForm((prev) => ({ ...prev, autoGenerate: e.target.checked }))} /><Label htmlFor="autoGenerate" className="cursor-pointer">Gerar arquivo automaticamente</Label></div></div><div className="space-y-2"><Label>Observações</Label><Textarea rows={3} value={createRemittanceForm.notes} onChange={(e) => setCreateRemittanceForm((prev) => ({ ...prev, notes: e.target.value }))} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpenCreateRemittance(false)}>Cancelar</Button><Button onClick={handleCreateRemittance} disabled={createRemittanceMutation.isPending || addRemittanceItemsMutation.isPending || generateCnabMutation.isPending}>{createRemittanceMutation.isPending || addRemittanceItemsMutation.isPending ? "Preparando..." : "Criar remessa"}</Button></div></div></DialogContent></Dialog>

      <Dialog open={openRemittanceDetails} onOpenChange={setOpenRemittanceDetails}><DialogContent className="sm:max-w-[1080px] max-h-[92vh] overflow-y-auto"><DialogHeader><DialogTitle>Detalhes da remessa</DialogTitle><DialogDescription>Itens, arquivo gerado, envio e retorno da remessa selecionada.</DialogDescription></DialogHeader>{remittanceDetailsLoading ? <div className="py-10 flex items-center justify-center text-slate-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Carregando remessa...</div> : selectedRemittanceDetails ? <div className="grid gap-5 py-2"><Card className="border-slate-200 bg-slate-50"><CardContent className="p-4 grid gap-3 md:grid-cols-4 text-sm"><div><div className="text-slate-500">Tipo</div><div className="font-bold text-slate-900">{remittanceTypeLabel(selectedRemittanceDetails.remittance.type)}</div></div><div><div className="text-slate-500">Sequência</div><div className="font-bold text-slate-900">#{selectedRemittanceDetails.remittance.sequenceNumber}</div></div><div><div className="text-slate-500">Itens</div><div className="font-bold text-slate-900">{selectedRemittanceDetails.items.length}</div></div><div><div className="text-slate-500">Status</div><Badge variant={statusBadgeVariant(selectedRemittanceDetails.remittance.status)}>{statusLabel(selectedRemittanceDetails.remittance.status)}</Badge></div></CardContent></Card><div className="flex flex-wrap gap-2"><Button variant="outline" className="gap-2" onClick={() => generateCnabMutation.mutate(selectedRemittanceDetails.remittance.id)} disabled={selectedRemittanceDetails.items.length === 0 || generateCnabMutation.isPending}><FileCode2 className="h-4 w-4" />Gerar arquivo</Button><Button variant="outline" className="gap-2" onClick={() => handleDownloadRemittance(selectedRemittanceDetails.remittance.id)} disabled={!selectedRemittanceDetails.remittance.hasGeneratedContent}><BanknoteArrowDown className="h-4 w-4" />Baixar arquivo</Button><Button variant="outline" className="gap-2" onClick={() => { setSelectedRemittanceId(selectedRemittanceDetails.remittance.id); setMarkSentForm({ sentAt: today, fileName: selectedRemittanceDetails.remittance.fileName || `REMESSA_${String(selectedRemittanceDetails.remittance.sequenceNumber).padStart(6, "0")}.txt`, notes: selectedRemittanceDetails.remittance.notes || "" }); setOpenMarkSent(true); }} disabled={!selectedRemittanceDetails.remittance.hasGeneratedContent}><Send className="h-4 w-4" />Marcar enviada</Button><Button variant="outline" className="gap-2" onClick={() => { setSelectedRemittanceId(selectedRemittanceDetails.remittance.id); setImportReturnRows(selectedRemittanceDetails.items.map((item) => ({ installmentId: item.installmentId, label: `${item.contractNumber} • ${item.installmentLabel}`, include: false, status: selectedRemittanceDetails.remittance.type === "baixa" ? "baixado" : selectedRemittanceDetails.remittance.type === "cancelamento" ? "cancelado" : "liquidado", paidValue: String(item.totalDue || item.nominalValue || 0), paymentDate: today, occurrenceCode: "", occurrenceMessage: "" }))); setOpenImportReturn(true); }} disabled={selectedRemittanceDetails.items.length === 0}><BanknoteArrowDown className="h-4 w-4" />Importar retorno</Button><Button variant="outline" className="gap-2" onClick={() => { setEventsTitle(`Eventos da remessa #${selectedRemittanceDetails.remittance.sequenceNumber}`); setEventsFilter({ remittanceId: selectedRemittanceDetails.remittance.id }); setOpenEvents(true); }}><Eye className="h-4 w-4" />Eventos</Button></div><div className="overflow-x-auto rounded-lg border border-slate-200"><Table><TableHeader className="bg-slate-50/80"><TableRow><TableHead>Contrato</TableHead><TableHead>Parcela</TableHead><TableHead>Cliente</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Movimento</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{selectedRemittanceDetails.items.map((item) => <TableRow key={item.id}><TableCell><div className="font-medium">{item.contractNumber}</div><div className="text-xs text-slate-500">{item.nossoNumero || "-"}</div></TableCell><TableCell>{item.installmentLabel}</TableCell><TableCell>{item.clientName || "-"}</TableCell><TableCell>{formatDate(item.dueDate)}</TableCell><TableCell>{formatCurrency(item.totalDue || item.nominalValue || 0)}</TableCell><TableCell><div>{item.instructionCode || "-"}</div><div className="text-xs text-slate-500">Mov. {item.movementCode || "-"}</div></TableCell><TableCell><Badge variant={statusBadgeVariant(item.status || "rascunho")}>{statusLabel(item.status || "rascunho")}</Badge>{item.occurrenceMessage ? <div className="mt-1 text-xs text-slate-500">{item.occurrenceMessage}</div> : null}</TableCell></TableRow>)}</TableBody></Table></div></div> : <div className="py-10 text-center text-slate-500">Remessa não encontrada.</div>}</DialogContent></Dialog>

      <Dialog open={openMarkSent} onOpenChange={setOpenMarkSent}><DialogContent className="sm:max-w-[560px]"><DialogHeader><DialogTitle>Marcar remessa como enviada</DialogTitle><DialogDescription>Informe os dados operacionais do envio ao banco.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div className="space-y-2"><Label>Data de envio</Label><Input type="date" value={markSentForm.sentAt} onChange={(e) => setMarkSentForm((prev) => ({ ...prev, sentAt: e.target.value }))} /></div><div className="space-y-2"><Label>Nome do arquivo</Label><Input value={markSentForm.fileName} onChange={(e) => setMarkSentForm((prev) => ({ ...prev, fileName: e.target.value }))} /></div><div className="space-y-2"><Label>Observações</Label><Textarea rows={3} value={markSentForm.notes} onChange={(e) => setMarkSentForm((prev) => ({ ...prev, notes: e.target.value }))} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpenMarkSent(false)}>Cancelar</Button><Button onClick={() => selectedRemittanceId && markSentMutation.mutate({ remittanceId: selectedRemittanceId, payload: markSentForm })} disabled={markSentMutation.isPending || !selectedRemittanceId}>{markSentMutation.isPending ? "Salvando..." : "Confirmar envio"}</Button></div></div></DialogContent></Dialog>

      <Dialog open={openImportReturn} onOpenChange={setOpenImportReturn}><DialogContent className="sm:max-w-[1080px] max-h-[92vh] overflow-y-auto"><DialogHeader><DialogTitle>Importar retorno bancário</DialogTitle><DialogDescription>Informe os itens efetivamente processados no banco para atualizar o financeiro.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div className="overflow-x-auto rounded-lg border border-slate-200"><Table><TableHeader className="bg-slate-50/80"><TableRow><TableHead className="w-[60px]">OK</TableHead><TableHead>Parcela</TableHead><TableHead>Status retorno</TableHead><TableHead>Valor pago</TableHead><TableHead>Data pagto.</TableHead><TableHead>Ocorrência</TableHead><TableHead>Mensagem</TableHead></TableRow></TableHeader><TableBody>{importReturnRows.map((row, index) => <TableRow key={row.installmentId}><TableCell><input type="checkbox" checked={row.include} onChange={(e) => setImportReturnRows((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, include: e.target.checked } : item))} /></TableCell><TableCell>{row.label}</TableCell><TableCell><Select value={row.status} onValueChange={(value: ImportReturnLine["status"]) => setImportReturnRows((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, status: value } : item))}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="liquidado">Liquidado</SelectItem><SelectItem value="pago">Pago</SelectItem><SelectItem value="baixado">Baixado</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem><SelectItem value="rejeitado">Rejeitado</SelectItem></SelectContent></Select></TableCell><TableCell><Input type="number" step="0.01" value={row.paidValue} onChange={(e) => setImportReturnRows((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, paidValue: e.target.value } : item))} disabled={["baixado", "cancelado", "rejeitado"].includes(row.status)} /></TableCell><TableCell><Input type="date" value={row.paymentDate} onChange={(e) => setImportReturnRows((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, paymentDate: e.target.value } : item))} disabled={["baixado", "cancelado", "rejeitado"].includes(row.status)} /></TableCell><TableCell><Input value={row.occurrenceCode} onChange={(e) => setImportReturnRows((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, occurrenceCode: e.target.value } : item))} placeholder="ex.: 06" /></TableCell><TableCell><Input value={row.occurrenceMessage} onChange={(e) => setImportReturnRows((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, occurrenceMessage: e.target.value } : item))} placeholder="Mensagem do banco" /></TableCell></TableRow>)}</TableBody></Table></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpenImportReturn(false)}>Cancelar</Button><Button onClick={() => { if (!selectedRemittanceId) return; const items = importReturnRows.filter((item) => item.include).map((item) => ({ installmentId: item.installmentId, status: item.status, paidValue: toNumber(item.paidValue), paymentDate: ["baixado", "cancelado", "rejeitado"].includes(item.status) ? null : item.paymentDate || null, occurrenceCode: item.occurrenceCode || null, occurrenceMessage: item.occurrenceMessage || null })); if (items.length === 0) { toast({ title: "Seleção obrigatória", description: "Marque pelo menos um item para importar o retorno.", variant: "destructive" }); return; } importReturnMutation.mutate({ remittanceId: selectedRemittanceId, items }); }} disabled={importReturnMutation.isPending || !selectedRemittanceId}>{importReturnMutation.isPending ? "Importando..." : "Importar retorno"}</Button></div></div></DialogContent></Dialog>

      <Dialog open={openEvents} onOpenChange={setOpenEvents}><DialogContent className="sm:max-w-[840px] max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{eventsTitle}</DialogTitle><DialogDescription>Histórico operacional do financeiro, remessas e retorno bancário.</DialogDescription></DialogHeader>{eventsLoading ? <div className="py-8 flex items-center justify-center text-slate-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Carregando eventos...</div> : filteredEvents.length === 0 ? <div className="py-8 text-center text-slate-500">Nenhum evento encontrado para o contexto selecionado.</div> : <div className="space-y-3 py-2">{filteredEvents.map((event) => <div key={event.id} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-col md:flex-row md:items-center justify-between gap-2"><div><div className="font-semibold text-slate-900">{event.title || event.eventType}</div><div className="text-sm text-slate-500">{event.description || "Sem descrição"}</div></div><div className="flex items-center gap-2">{event.eventStatus ? <Badge variant={statusBadgeVariant(event.eventStatus)}>{statusLabel(event.eventStatus)}</Badge> : null}<div className="text-xs text-slate-500">{formatDate(event.createdAt)}</div></div></div><div className="mt-2 text-xs text-slate-500">Tipo: {event.eventType}{event.createdBy ? ` • Usuário: ${event.createdBy}` : ""}</div></div>)}</div>}</DialogContent></Dialog>

      <Dialog open={openReceivableCancel} onOpenChange={setOpenReceivableCancel}><DialogContent className="sm:max-w-[620px]"><DialogHeader><DialogTitle>Cancelar financeiro do contrato</DialogTitle><DialogDescription>Esta ação cancela o recebível e as parcelas. Havendo vida bancária, o sistema também prepara solicitações de baixa/cancelamento bancário.</DialogDescription></DialogHeader><div className="grid gap-4 py-2">{selectedReceivable && <Card className="border-slate-200 bg-slate-50"><CardContent className="p-4 grid gap-3 md:grid-cols-2 text-sm"><div><div className="text-slate-500">Contrato</div><div className="font-bold text-slate-900">{selectedReceivable.contractNumber}</div></div><div><div className="text-slate-500">Cliente</div><div className="font-bold text-slate-900">{selectedReceivable.clientName}</div></div></CardContent></Card>}<div className="space-y-2"><Label>Motivo</Label><Textarea rows={4} value={receivableCancelForm.reason} onChange={(e) => setReceivableCancelForm((prev) => ({ ...prev, reason: e.target.value }))} /></div><div className="flex items-center gap-2"><input id="requestBankOps" type="checkbox" checked={receivableCancelForm.requestBankOps} onChange={(e) => setReceivableCancelForm((prev) => ({ ...prev, requestBankOps: e.target.checked }))} /><Label htmlFor="requestBankOps" className="cursor-pointer">Preparar operações bancárias quando houver vida bancária</Label></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpenReceivableCancel(false)}>Voltar</Button><Button variant="destructive" onClick={() => selectedReceivable && cancelReceivableMutation.mutate({ id: selectedReceivable.id, payload: { reason: receivableCancelForm.reason || null, requestBankOps: receivableCancelForm.requestBankOps } })} disabled={cancelReceivableMutation.isPending}>{cancelReceivableMutation.isPending ? "Cancelando..." : "Confirmar cancelamento"}</Button></div></div></DialogContent></Dialog>
    </div>
  );
}
