import DashboardLayout from "../../components/dashboard/DashboardLayout";

export default function CampusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
