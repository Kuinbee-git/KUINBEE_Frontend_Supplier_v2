import { DashboardPage, DashboardPageHeader } from "@/components/dashboard";
import { SupplierDataRequirementForm } from "@/components/data-requirements/SupplierDataRequirementForm";

export default function SubmitDataRequirementPage() {
  return (
    <DashboardPage width="standard">
      <DashboardPageHeader
        title="Submit a data requirement"
        description="Tell Kuinbee what data you need. The admin team will manage the requirement after submission."
        meta="Data sourcing"
      />
      <SupplierDataRequirementForm />
    </DashboardPage>
  );
}
