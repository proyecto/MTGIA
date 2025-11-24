

interface SidebarProps {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
}

export default function Sidebar({ activeTab = 'collection', onTabChange }: SidebarProps) {
    const menuItems = [
        { id: 'collection', label: 'My Collection', icon: '📚' },
        { id: 'decks', label: 'Dashboard', icon: '📊' },
        { id: 'wishlist', label: 'Wishlist', icon: '⭐️' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <aside className="w-[236px] bg-sidebar-bg border-r border-border-color flex flex-col h-full">
            <div className="p-4 pt-8">
                <h1 className="text-xl font-bold text-text-primary mb-1">MTG Manager</h1>
                <p className="text-xs text-text-secondary">Collection Tracker</p>
            </div>

            <div className="px-2 py-4 flex-1">
                <div className="space-y-1">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onTabChange?.(item.id)}
                            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                        >
                            <span className="mr-3">{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-8">
                    <h3 className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                        Sets
                    </h3>
                    <div className="space-y-1">
                        <div
                            className="sidebar-item"
                            onClick={() => onTabChange?.('allsets')}
                        >
                            <span className="mr-3">📦</span>
                            <span>All Sets</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
