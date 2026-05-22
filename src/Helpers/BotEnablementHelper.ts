import { injectable } from "tsyringe";
import { BossBots, FollowerBots, PMCBots, ScavBots, SpecialBots, EventBots, AlwaysDisabledBots } from "../Enums/Bots";
import { ModConfig } from "../Globals/ModConfig";

@injectable()
export class BotEnablementHelper
{
    public static readonly PMC_SET: ReadonlySet<string> = new Set(Object.values(PMCBots));
    public static readonly SCAV_SET: ReadonlySet<string> = new Set(Object.values(ScavBots));
    public static readonly BOSS_SET: ReadonlySet<string> = new Set(Object.values(BossBots));
    public static readonly FOLLOWER_SET: ReadonlySet<string> = new Set(Object.values(FollowerBots));
    public static readonly SPECIAL_SET: ReadonlySet<string> = new Set(Object.values(SpecialBots));
    public static readonly EVENT_SET: ReadonlySet<string> = new Set(Object.values(EventBots));

    constructor()
    {}

    public doesBotExist(botType: string): boolean
    {
        const boss: string[] = Object.values(BossBots);
        const follower: string[] = Object.values(FollowerBots);
        const pmc: string[] = Object.values(PMCBots);
        const scav: string[] = Object.values(ScavBots);
        const special: string[] = Object.values(SpecialBots);
        const event: string[] = Object.values(EventBots);

        if (!boss.includes(botType) && !follower.includes(botType) && !pmc.includes(botType) && !scav.includes(botType) && !special.includes(botType) && !event.includes(botType))
        {            
            return false;
        }
        return true;
    }
    
    public botDisabled(botType: string): boolean
    {
        botType = botType.toLowerCase();
        // Special Handling for Modded Bot Types
        if (this.isModdedBot(botType)) return true;

        // Normal bot types
        if (this.isPMC(botType)) return !ModConfig.config.pmcBots.enable;
        if (this.isScav(botType)) return !ModConfig.config.scavBots.enable;
        if (this.isBoss(botType)) return !ModConfig.config.bossBots.enable;
        if (this.isFollower(botType)) return !ModConfig.config.followerBots.enable;
        if (this.isSpecial(botType)) return !ModConfig.config.specialBots.enable;
        if (this.isEvent(botType)) return true;
        return false;
    }

    private isBoss(botType: string): boolean
    {
        return BotEnablementHelper.BOSS_SET.has(botType);
    }

    private isFollower(botType: string): boolean
    {        
        return BotEnablementHelper.FOLLOWER_SET.has(botType);
    }

    private isPMC(botType: string): boolean
    {
        return BotEnablementHelper.PMC_SET.has(botType);
    }

    private isScav(botType: string): boolean
    {
        return BotEnablementHelper.SCAV_SET.has(botType);
    }

    private isEvent(botType: string): boolean
    {
        return BotEnablementHelper.EVENT_SET.has(botType);
    }

    private isSpecial(botType: string): boolean
    {
        return BotEnablementHelper.SPECIAL_SET.has(botType);
    }

    private isModdedBot(botType: string): boolean
    {
        return Object.values(AlwaysDisabledBots).includes(botType as AlwaysDisabledBots);
    }
}