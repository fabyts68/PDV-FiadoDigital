-- CreateIndex
CREATE INDEX "backup_history_status_idx" ON "backup_history"("status");

-- CreateIndex
CREATE INDEX "backup_history_created_at_idx" ON "backup_history"("created_at");

-- CreateIndex
CREATE INDEX "card_machine_rates_card_machine_id_idx" ON "card_machine_rates"("card_machine_id");

-- CreateIndex
CREATE INDEX "card_machines_deleted_at_idx" ON "card_machines"("deleted_at");

-- CreateIndex
CREATE INDEX "card_machines_is_active_idx" ON "card_machines"("is_active");
