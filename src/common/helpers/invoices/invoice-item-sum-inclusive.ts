/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */
import collect from 'collect.js';
import { Invoice } from '$app/common/interfaces/invoice';
import { InvoiceItem } from '$app/common/interfaces/invoice-item';
import { PurchaseOrder } from '$app/common/interfaces/purchase-order';
import { Credit } from '$app/common/interfaces/credit';
import { Quote } from '$app/common/interfaces/quote';
import { RecurringInvoice } from '$app/common/interfaces/recurring-invoice';

export class InvoiceItemSumInclusive {
  public taxCollection = collect();

  public lineItems: InvoiceItem[] = [];
  protected items = new Map();
  protected item!: InvoiceItem;

  public subTotal = 0;
  protected grossSubTotal = 0;
  public totalTaxes = 0;

  constructor(
    protected invoice:
      | Invoice
      | Credit
      | Quote
      | PurchaseOrder
      | RecurringInvoice
  ) {}

  public async process() {
    if (!this.invoice?.line_items || this.invoice.line_items?.length === 0) {
      return this.items;
    }

    this.calculateLineItems();

    return this;
  }

  protected calculateLineItems() {
    this.invoice.line_items.map((item: InvoiceItem) => {
      this.item = item;

      this.cleanLineItem().sumLineItem().setDiscount().calculateTaxes().push();
    });

    return this;
  }

  protected cleanLineItem() {
    // we are using typescript, we don't have to clean anything.

    return this;
  }

  protected sumLineItem() {
    this.item.line_total = this.item.cost * this.item.quantity;

    return this;
  }

  protected setDiscount() {
    if (this.invoice.is_amount_discount) {
      this.item.line_total = parseFloat((this.item.line_total - this.item.discount).toFixed(2));
    } else {
      this.item.line_total = parseFloat((this.item.line_total - this.item.line_total * (this.item.discount / 100)).toFixed(2));
    }

    this.item.is_amount_discount = this.invoice.is_amount_discount;

    return this;
  }

  protected calculateTaxes() {
    let itemTax = 0;

    const amount =
      this.item.line_total -
      this.item.line_total * (this.invoice.discount / 100);

    //

    const itemTaxRateOneLocal = this.calcInclusiveLineTax(
      this.item.tax_rate1,
      amount
    );

    itemTax += itemTaxRateOneLocal;

    if (this.item.tax_name1.length >= 1) {
      this.groupTax(
        this.item.tax_name1,
        this.item.tax_rate1,
        itemTaxRateOneLocal
      );
    }

    //

    const itemTaxRateTwoLocal = this.calcInclusiveLineTax(
      this.item.tax_rate2,
      amount
    );

    itemTax += itemTaxRateTwoLocal;

    if (this.item.tax_name2.length >= 1) {
      this.groupTax(
        this.item.tax_name2,
        this.item.tax_rate2,
        itemTaxRateTwoLocal
      );
    }

    //

    const itemTaxRateThreeLocal = this.calcInclusiveLineTax(
      this.item.tax_rate3,
      amount
    );

    itemTax += itemTaxRateThreeLocal;

    if (this.item.tax_name3.length >= 1) {
      this.groupTax(
        this.item.tax_name3,
        this.item.tax_rate3,
        itemTaxRateThreeLocal
      );
    }

    // this.item.gross_line_total = this.item.line_total + itemTax;
    this.item.gross_line_total = this.item.line_total;
    this.totalTaxes += itemTax;

    return this;
  }

  protected groupTax(name: string, rate: number, total: number) {
    let group = {};

    const key = name + rate.toString().replace(' ', ''); // 'Tax Rate' + '5' => 'TaxRate5'

    group = { key, total, name: `${name} ${parseFloat(rate.toString())} %` }; // 'Tax Rate 5.00%'

    this.taxCollection.push(collect(group));
  }

  protected calcInclusiveLineTax(rate: number, amount: number) {
    return amount - amount / (1 + rate / 100);
  }

  protected push() {
    this.subTotal += this.item.line_total;

    this.grossSubTotal += this.item.gross_line_total;

    this.lineItems.push(this.item);

    return this;
  }

  public calculateTaxesWithAmountDiscount() {
    this.taxCollection = collect();

    this.lineItems
      // .filter((item) => item.line_total > 0)
      .map((item, index: number) => {
        let itemTax = 0;
        this.item = item;

        if (item.line_total > 0) {
          const amount =
            this.subTotal > 0
              ? this.item.line_total -
                this.invoice.discount * (this.item.line_total / this.subTotal)
              : 0;

          const itemTaxRateOneTotal = this.calcInclusiveLineTax(
            this.item.tax_rate1,
            amount
          );

          itemTax += itemTaxRateOneTotal;

          if (itemTaxRateOneTotal !== 0) {
            this.groupTax(
              this.item.tax_name1,
              this.item.tax_rate1,
              itemTaxRateOneTotal
            );
          }

          //

          const itemTaxRateTwoTotal = this.calcInclusiveLineTax(
            this.item.tax_rate2,
            amount
          );

          itemTax += itemTaxRateTwoTotal;

          if (itemTaxRateTwoTotal !== 0) {
            this.groupTax(
              this.item.tax_name2,
              this.item.tax_rate2,
              itemTaxRateTwoTotal
            );
          }

          //

          const itemTaxRateThree = this.calcInclusiveLineTax(
            this.item.tax_rate3,
            amount
          );

          itemTax += itemTaxRateThree;

          if (itemTaxRateThree !== 0) {
            this.groupTax(
              this.item.tax_name3,
              this.item.tax_rate3,
              itemTaxRateThree
            );
          }

          this.item.gross_line_total = this.item.line_total;
          this.item.tax_amount = isNaN(itemTax) ? 0 : itemTax;
        }

        this.lineItems[index] = this.item;
        this.totalTaxes += itemTax;
      });
  }
}
