import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    headId: { type: Schema.Types.ObjectId, ref: "Employee" },
  },
  { timestamps: true }
);

DepartmentSchema.index({ name: 1 }, { unique: true });

export type DepartmentDoc = InferSchemaType<typeof DepartmentSchema>;

export const Department: Model<DepartmentDoc> =
  models.Department ?? model("Department", DepartmentSchema);
