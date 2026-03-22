export const defaultLotContractTemplate = `
CONTRATO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE LOTE

Pelo presente instrumento particular, de um lado:

PROMITENTE VENDEDORA:
{{seller_name}}, inscrita sob o documento {{seller_document}},
neste ato representada por {{seller_signer_name}},
documento {{seller_signer_document}},
doravante denominada simplesmente VENDEDORA.

E, de outro lado:

PROMITENTE COMPRADOR(A):
{{client_name}}, documento {{client_document}},
telefone {{client_phone}},
e-mail {{client_email}},
doravante denominado(a) simplesmente COMPRADOR(A).

As partes acima identificadas têm, entre si, justo e contratado o presente
CONTRATO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE LOTE, que será regido
pelas cláusulas e condições seguintes:

CLÁUSULA 1 – DO OBJETO
1.1. O presente contrato tem por objeto a promessa de compra e venda do lote
{{lot_code}}, integrante do empreendimento {{development_name}}.

CLÁUSULA 2 – DO PREÇO
2.1. O preço certo e ajustado para esta negociação é de {{total_value}}.
2.2. O COMPRADOR(A) pagará a título de entrada o valor de {{down_payment_value}}.
2.3. O saldo remanescente, no valor de {{financed_amount}}, será pago na forma
ajustada entre as partes.

CLÁUSULA 3 – DO PARCELAMENTO
3.1. O saldo será pago em {{installments}} parcelas mensais e sucessivas.
3.2. O valor da primeira parcela será de {{first_installment}}.
3.3. Sobre as parcelas incidirá juros de {{interest_rate}}% ao mês, com correção
pelo índice {{correction_index}}, quando aplicável.

CLÁUSULA 4 – DA FORMA DE PAGAMENTO
4.1. A forma de pagamento ajustada entre as partes é: {{payment_method}}.

CLÁUSULA 5 – DO INADIMPLEMENTO
5.1. O atraso no pagamento de qualquer obrigação assumida neste contrato sujeitará
o COMPRADOR(A) aos encargos de mora, multa, juros e atualização monetária, na forma
da legislação aplicável e das regras comerciais vigentes.
5.2. O inadimplemento poderá ensejar a resolução contratual, observadas as
disposições legais e contratuais aplicáveis.

CLÁUSULA 6 – DA POSSE E TRANSFERÊNCIA
6.1. A posse, cessão, transferência, escritura e demais atos formais relacionados
ao imóvel observarão as condições financeiras, documentais e legais exigidas pela
VENDEDORA e pela legislação vigente.

CLÁUSULA 7 – DA RESCISÃO
7.1. Em caso de rescisão por iniciativa do COMPRADOR(A), inadimplemento ou outra
hipótese legal/contratual, poderão ser aplicadas retenções, multas e demais
consequências cabíveis, observada a legislação vigente.

CLÁUSULA 8 – DAS DECLARAÇÕES
8.1. O COMPRADOR(A) declara ter recebido as informações necessárias sobre o lote,
empreendimento, condições comerciais, índices, prazos e forma de pagamento.
8.2. As partes declaram que leram, compreenderam e aceitam integralmente os termos
deste contrato.

CLÁUSULA 9 – DA INTERMEDIAÇÃO
9.1. A intermediação desta negociação foi realizada por {{broker_name}}.

CLÁUSULA 10 – DAS OBSERVAÇÕES COMPLEMENTARES
10.1. Observações adicionais da negociação:
{{notes}}

CLÁUSULA 11 – DO FORO
11.1. Fica eleito o foro da comarca competente do empreendimento, com renúncia de
qualquer outro, por mais privilegiado que seja, para dirimir eventuais controvérsias
oriundas deste contrato.

Data da venda: {{sale_date}}

ASSINATURA DO COMPRADOR(A)
Nome: {{buyer_signer_name}}
Documento: {{buyer_signer_document}}
Status: {{buyer_signature_status}}
Data/Hora: {{buyer_signed_at}}

ASSINATURA DA VENDEDOR(A)
Nome: {{seller_signer_name}}
Documento: {{seller_signer_document}}
Status: {{seller_signature_status}}
Data/Hora: {{seller_signed_at}}
`.trim();