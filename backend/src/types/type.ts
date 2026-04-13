import { Prisma } from "@prisma/client";

type PlanStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
type CropStatus =
  | "SOWN"
  | "GROWING"
  | "FLOWERING"
  | "HARVEST_READY"
  | "HARVESTED"
  | "DAMAGED";

type UpdateSeasonPlanBody = Partial<{
  // only allow fields you actually want to update
  cropId: string;
  seasonId: string;

  expectedYield: string | null;
  expectedCost: string | null;

  status: PlanStatus;
  cropStatus: CropStatus;

  sowingDate: string | null;
  expectedEndDate: string | null;
  actualEndDate: string | null;
}>;


