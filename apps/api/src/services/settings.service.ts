import bcrypt from "bcryptjs";
import { config } from "../config/index.js";
import { AuditLogRepository } from "../repositories/audit-log.repository.js";
import { SettingsRepository } from "../repositories/settings.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import type { PixKeyType } from "../utils/pix-key.js";

const PIX_KEY_SETTING = "pix.key";
const PIX_KEY_TYPE_SETTING = "pix.key_type";
const PIX_MERCHANT_NAME_SETTING = "pix.merchant_name";
const PIX_MERCHANT_CITY_SETTING = "pix.merchant_city";
const DISCOUNT_LIMIT_DAILY_SETTING = "discount_limit_daily";
const DISCOUNT_LIMIT_WEEKLY_SETTING = "discount_limit_weekly";
const DISCOUNT_LIMIT_MONTHLY_SETTING = "discount_limit_monthly";

export class SettingsService {
  private settingsRepository: SettingsRepository;
  private userRepository: UserRepository;
  private auditLogRepository: AuditLogRepository;

  constructor() {
    this.settingsRepository = new SettingsRepository();
    this.userRepository = new UserRepository();
    this.auditLogRepository = new AuditLogRepository();
  }

  async getPixSettings(): Promise<{
    pix_key_type: PixKeyType | "";
    pix_key: string;
    merchant_name: string;
    merchant_city: string;
  }> {
    const keys = [
      PIX_KEY_SETTING,
      PIX_KEY_TYPE_SETTING,
      PIX_MERCHANT_NAME_SETTING,
      PIX_MERCHANT_CITY_SETTING,
    ];
    const settings = await this.settingsRepository.findMany(keys);

    const settingsMap = new Map(
      settings.map((s: { key: string; value: string }) => [s.key, s.value]),
    );

    return {
      pix_key_type: (settingsMap.get(PIX_KEY_TYPE_SETTING) || config.pix.keyType || "") as PixKeyType | "",
      pix_key: (settingsMap.get(PIX_KEY_SETTING) || config.pix.key || "") as string,
      merchant_name: (settingsMap.get(PIX_MERCHANT_NAME_SETTING) || config.pix.merchantName || "") as string,
      merchant_city: (settingsMap.get(PIX_MERCHANT_CITY_SETTING) || config.pix.merchantCity || "") as string,
    };
  }

  async updatePixSettings(data: {
    user_id: string;
    password: string;
    pix_key_type: PixKeyType;
    pix_key: string;
    merchant_name: string;
    merchant_city: string;
  }) {
    const user = await this.userRepository.findById(data.user_id);

    if (!user || !user.is_active) {
      throw new Error("Acesso negado");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error("Senha incorreta. Alteração não autorizada.");
    }

    await Promise.all([
      this.settingsRepository.upsert(PIX_KEY_SETTING, data.pix_key),
      this.settingsRepository.upsert(PIX_KEY_TYPE_SETTING, data.pix_key_type),
      this.settingsRepository.upsert(PIX_MERCHANT_NAME_SETTING, data.merchant_name),
      this.settingsRepository.upsert(PIX_MERCHANT_CITY_SETTING, data.merchant_city),
    ]);

    await this.auditLogRepository.create({
      action: "pix_key_changed",
      actor_id: data.user_id,
      entity_type: "settings",
      entity_id: PIX_KEY_SETTING,
      details: { user_id: data.user_id },
    });

    return { success: true };
  }

  async getGeneralSettings(): Promise<{
    discount_limit_daily: number;
    discount_limit_weekly: number;
    discount_limit_monthly: number;
  }> {
    const keys = [
      DISCOUNT_LIMIT_DAILY_SETTING,
      DISCOUNT_LIMIT_WEEKLY_SETTING,
      DISCOUNT_LIMIT_MONTHLY_SETTING,
    ];

    const settings = await this.settingsRepository.findMany(keys);
    const map = new Map(settings.map((setting) => [setting.key, setting.value]));

    return {
      discount_limit_daily: Number.parseInt(map.get(DISCOUNT_LIMIT_DAILY_SETTING) ?? "0", 10) || 0,
      discount_limit_weekly: Number.parseInt(map.get(DISCOUNT_LIMIT_WEEKLY_SETTING) ?? "0", 10) || 0,
      discount_limit_monthly: Number.parseInt(map.get(DISCOUNT_LIMIT_MONTHLY_SETTING) ?? "0", 10) || 0,
    };
  }

  async updateGeneralSettings(data: {
    discount_limit_daily?: number;
    discount_limit_weekly?: number;
    discount_limit_monthly?: number;
  }) {
    const operations: Promise<unknown>[] = [];

    if (data.discount_limit_daily !== undefined) {
      operations.push(
        this.settingsRepository.upsert(
          DISCOUNT_LIMIT_DAILY_SETTING,
          String(data.discount_limit_daily),
        ),
      );
    }

    if (data.discount_limit_weekly !== undefined) {
      operations.push(
        this.settingsRepository.upsert(
          DISCOUNT_LIMIT_WEEKLY_SETTING,
          String(data.discount_limit_weekly),
        ),
      );
    }

    if (data.discount_limit_monthly !== undefined) {
      operations.push(
        this.settingsRepository.upsert(
          DISCOUNT_LIMIT_MONTHLY_SETTING,
          String(data.discount_limit_monthly),
        ),
      );
    }

    await Promise.all(operations);

    return this.getGeneralSettings();
  }
}
