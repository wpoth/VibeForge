import { DashboardApp } from "@/components/dashboard/DashboardApp";

type PlaylistDashboardPageProps = {
    params: Promise<{
        playlistId: string;
    }>;
};

export default async function PlaylistDashboardPage({
    params,
}: PlaylistDashboardPageProps) {
    const { playlistId } = await params;

    return <DashboardApp initialPlaylistId={decodeURIComponent(playlistId)} />;
}