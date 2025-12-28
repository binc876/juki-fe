"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    SortingState,
    ColumnFiltersState,
} from "@tanstack/react-table"
import { Participant } from "@/lib/types"
import {
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Filter,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { dummyPesertaData } from "@/lib/dummyDataPeserta"

interface ManajemenPesertaProps {
    columns: ColumnDef<Participant>[];
    data?: Participant[]; // Optional karena kita pakai dummy
    currentPage?: number;
    totalPages?: number;
    totalPeserta?: number;
    onPageChange?: (page: number) => void;
    globalFilter?: string;
    onGlobalFilterChange?: (value: string) => void;
}

export function ManajemenPeserta({
    columns,
}: ManajemenPesertaProps) {
    const [pesertaData, setPesertaData] = useState<any[]>([])
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [globalFilter, setGlobalFilter] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Filter dan pagination dummy data
    useEffect(() => {
        let filtered = [...dummyPesertaData]

        // Filter berdasarkan search
        if (globalFilter) {
            const query = globalFilter.toLowerCase()
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.student_number.includes(query) ||
                p.email.toLowerCase().includes(query) ||
                p.mobile_number.includes(query)
            )
        }

        // Filter berdasarkan status
        if (statusFilter !== "all") {
            filtered = filtered.filter(p => {
                const status = getStatus(p)
                switch (statusFilter) {
                    case "belum-bayar":
                        return status === "Belum punya tiket"
                    case "sudah-bayar":
                        return status === "Sudah punya tiket"
                    case "sudah-daftar":
                        return status === "Sudah daftar pelatihan"
                    case "sudah-mengikuti":
                        return status === "Sudah mengikuti pelatihan"
                    case "sudah-loa":
                        return status === "Sudah terbit LOA"
                    default:
                        return true
                }
            })
        }

        // Pagination
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginated = filtered.slice(startIndex, endIndex)

        setPesertaData(paginated)
    }, [globalFilter, statusFilter, currentPage])

    const totalFiltered = dummyPesertaData.filter(p => {
        if (!globalFilter && statusFilter === "all") return true
        
        let match = true
        
        if (globalFilter) {
            const query = globalFilter.toLowerCase()
            match = match && (
                p.name.toLowerCase().includes(query) ||
                p.student_number.includes(query) ||
                p.email.toLowerCase().includes(query) ||
                p.mobile_number.includes(query)
            )
        }
        
        if (statusFilter !== "all") {
            const status = getStatus(p)
            match = match && (() => {
                switch (statusFilter) {
                    case "belum-bayar": return status === "Belum punya tiket"
                    case "sudah-bayar": return status === "Sudah punya tiket"
                    case "sudah-daftar": return status === "Sudah daftar pelatihan"
                    case "sudah-mengikuti": return status === "Sudah mengikuti pelatihan"
                    case "sudah-loa": return status === "Sudah terbit LOA"
                    default: return true
                }
            })()
        }
        
        return match
    }).length

    const totalPages = Math.ceil(totalFiltered / itemsPerPage)

    const table = useReactTable({
        data: pesertaData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        manualPagination: true,
        pageCount: totalPages,
        state: {
            sorting,
            columnFilters,
            pagination: {
                pageIndex: currentPage - 1,
                pageSize: itemsPerPage,
            },
        },
    })

    const getStatus = (participant: any): string => {
    const ticket = participant.user_tickets?.[0]

        // 1. Tidak punya tiket / belum bayar
        if (!ticket || !ticket.paid_at) {
            return "Belum Bayar Pelatihan"
        }

        const detail = ticket.user_ticket_detail
        const presence = ticket.presence ?? []

        // 2. LOA sudah terbit
        if (detail?.loa_path || detail?.loa_url) {
            return "Sudah terbit LOA"
        }

        // 3. Artikel sudah direview
        if (
            detail?.article_revision_status === "approved" ||
            detail?.article_revision_status === "needs_revision"
        ) {
            return "Sudah review artikel di OJS"
        }

        // 4. Sudah submit artikel ke OJS
        if (detail?.article_path || detail?.article_url) {
            return "Sudah Submit artikel di OJS"
        }

        // 5. Belum submit artikel (INI YANG TADI HILANG)
        if (detail?.article_title && !detail?.article_path && !detail?.article_url) {
            return "Belum Submit artikel di OJS"
        }

        // 6. Sudah mengikuti pelatihan
        if (ticket.training_schedule_id && presence.length > 0) {
            return "Sudah mengikuti pelatihan"
        }

        // 7. Sudah daftar pelatihan
        if (ticket.training_schedule_id) {
            return "Sudah Daftar Pelatihan"
        }

        // 8. Sudah bayar tapi belum apa-apa
        return "Sudah Bayar Pelatihan"
    }


    return (
        <>
            <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                    Manajemen Peserta
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                    Total: {totalFiltered} peserta
                </p>
            </div>
            <div className="w-full space-y-4 p-4 sm:p-6 bg-white rounded-xl shadow-sm">
                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Cari peserta..."
                                value={globalFilter ?? ""}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="pl-10 w-full text-sm"
                            />
                        </div>

                        {/* Status Filter Dropdown */}
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => {
                                setStatusFilter(value)
                                setCurrentPage(1) // Reset ke halaman 1
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-64 text-sm">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="belum-bayar">Belum Bayar Pelatihan</SelectItem>
                                <SelectItem value="sudah-bayar">Sudah Bayar Pelatihan</SelectItem>
                                <SelectItem value="sudah-daftar">Sudah Daftar Pelatihan</SelectItem>
                                <SelectItem value="sudah-mengikuti">Sudah Mengikuti Pelatihan</SelectItem>
                                <SelectItem value="sudah-loa">Sudah Terbit LOA</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table Container */}
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className="bg-gray-50">
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell
                                                    key={cell.id}
                                                    className="text-xs sm:text-sm text-gray-700"
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-32 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                <Filter className="w-10 h-10 mb-2 text-gray-300" />
                                                <p className="text-sm font-medium">Tidak ada data ditemukan</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Coba ubah filter pencarian Anda
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                        Menampilkan{" "}
                        <span className="font-semibold">
                            {(currentPage - 1) * itemsPerPage + 1}
                        </span>
                        {" "}-{" "}
                        <span className="font-semibold">
                            {Math.min(currentPage * itemsPerPage, totalFiltered)}
                        </span>
                        {" "}dari{" "}
                        <span className="font-semibold">{totalFiltered}</span> peserta
                    </div>

                    <div className="flex items-center gap-2 order-1 sm:order-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="hidden sm:flex"
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="ml-1 hidden sm:inline">Prev</span>
                        </Button>

                        <div className="hidden md:flex items-center gap-1">
                            <span className="text-sm text-gray-600">
                                Halaman{" "}
                                <span className="font-semibold">{currentPage}</span>
                                {" "}dari{" "}
                                <span className="font-semibold">{totalPages}</span>
                            </span>
                        </div>

                        <div className="md:hidden flex items-center px-3 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                            {currentPage} / {totalPages}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <span className="mr-1 hidden sm:inline">Next</span>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="hidden sm:flex"
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}