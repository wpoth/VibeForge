import { DashboardApp } from "@/components/dashboard/DashboardApp";

type PlaylistDashboardPageProps = {
    params: {
        playlistId: string;
    };
};

export default function PlaylistDashboardPage({
    params,
}: PlaylistDashboardPageProps) {
    return <DashboardApp initialPlaylistId={decodeURIComponent(params.playlistId)} />;
}