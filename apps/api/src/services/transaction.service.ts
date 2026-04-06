import { TransactionRepository, type TransactionQueryParams } from "../repositories/transaction.repository.js";

const transactionRepository = new TransactionRepository();

export class TransactionService {
  async listTransactions(params: TransactionQueryParams) {
    return transactionRepository.listTransactions(params);
  }
}
