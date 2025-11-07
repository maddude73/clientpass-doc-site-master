import { Sidebar } from './Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 md:ml-64 overflow-auto transition-all duration-300">
                {children}
            </main>
        </div>
    );
};
