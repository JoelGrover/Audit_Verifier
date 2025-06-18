'use client'
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { MoreHorizontal, Upload, Download, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { useToast } from "@/components/Toast/Toast"
import { useRouter } from 'next/navigation';

export default function FilesPage() {
    const { success, error, info, warning } = useToast()
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Excel export states
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportingFile, setExportingFile] = useState(null);
    const [exportProgress, setExportProgress] = useState('');
    const [exportStatus, setExportStatus] = useState('idle');
    const [deletePin, setDeletePin] = useState('')
    const router = useRouter();

    useEffect(() => {
        fetchFiles();
    }, []);

    async function fetchFiles() {
        setLoading(true);
        try {
            const res = await fetch('/api/get-files');
            const data = await res.json();
            setFiles(data.files);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload() {
        if (!selectedFile) return;
        const form = new FormData();
        form.append('file', selectedFile);
        setUploading(true);
        try {
            await axios.post('/api/extract-data', form);
            setOpen(false);
            setSelectedFile(null);
            fetchFiles();
            success('File uploaded successfully');
        } catch (err) {
            error('Upload failed');
        } finally {
            setUploading(false);
        }
    }

    async function handleDeleteFile() {
        if (!fileToDelete) return;
        if (!deletePin) {
            error("Please Provide Delete Pin")
            return;
        }
        try {
            await axios.delete(`/api/delete-file?id=${fileToDelete.id}`, {
                data: { deletePin }
            });
            setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
            success("File deleted successfully");
        } catch (err) {
            console.error(err);
            error("Failed to delete file");
        } finally {
            setConfirmOpen(false);
            setFileToDelete(null);
        }
    }

    async function handleDownload(file) {
        setExportingFile(file);
        setExportModalOpen(true);
        setExportStatus('loading');
        setExportProgress('Preparing export...');

        try {
            const params = new URLSearchParams({
                fileId: file.id
            });

            setExportProgress('Fetching data from database...');

            const response = await fetch(`/api/download-file?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Export failed');
            }

            setExportProgress('Generating Excel file...');

            // Get the blob from response
            const blob = await response.blob();

            // Get filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `${file.name}_export.xlsx`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            setExportProgress('Starting download...');

            // Create download link and trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            // Clean up the URL object
            window.URL.revokeObjectURL(url);

            setExportStatus('success');
            setExportProgress('Download completed successfully!');
            success('Excel file downloaded successfully');

            // Auto close modal after success
            setTimeout(() => {
                setExportModalOpen(false);
                resetExportState();
            }, 2000);

        } catch (err) {
            console.error('Export error:', err);
            setExportStatus('error');
            setExportProgress(`Export failed: ${err.message}`);
            error(`Export failed: ${err.message}`);
        }
    }

    function resetExportState() {
        setExportingFile(null);
        setExportProgress('');
        setExportStatus('idle');
    }

    function closeExportModal() {
        setExportModalOpen(false);
        resetExportState();
    }

    const filteredFiles = files.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusIcon = () => {
        switch (exportStatus) {
            case 'loading':
                return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <FileSpreadsheet className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = () => {
        switch (exportStatus) {
            case 'loading':
                return 'text-blue-600 bg-blue-50';
            case 'success':
                return 'text-green-600 bg-green-50';
            case 'error':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="p-4 min-h-screen md:p-6 max-w-6xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-xl md:text-2xl font-bold">Files</h1>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    <Input
                        placeholder="Search files…"
                        className="sm:w-64 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="cursor-pointer w-full sm:w-auto">
                                <Upload className="w-4 h-4 mr-2" /> Upload
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Upload File</DialogTitle>
                            </DialogHeader>
                            <Input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                            <Button
                                className="cursor-pointer"
                                onClick={handleUpload}
                                disabled={uploading || !selectedFile}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload'
                                )}
                            </Button>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading files...
                </div>
            ) : files.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    No files available.
                </div>
            ) : (
                <>

                    <div className="hidden md:block rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[30%]">File Name</TableHead>
                                    <TableHead className="w-[30%]">Upload Date</TableHead>
                                    <TableHead className="w-[30%]">Updated At</TableHead>
                                    <TableHead className="w-[10%] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {filteredFiles.map((file) => (
                                    <TableRow key={file.id}>
                                        <TableCell className="font-medium">{file.name}</TableCell>
                                        <TableCell>
                                            {format(new Date(file.createdAt), 'PPPpp')}
                                        </TableCell>
                                        <TableCell>
                                            {file.updatedAt
                                                ? format(new Date(file.updatedAt), 'PPPpp')
                                                : 'Not Yet'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button onClick={() => router.push(`/files/${file.id}`)} className="w-20 cursor-pointer" variant="default">
                                                    Open
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="outline-none focus:ring-0 p-2 cursor-pointer"
                                                            size="icon"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            onClick={() => handleDownload(file)}
                                                        >
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download Excel
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-500 cursor-pointer"
                                                            onClick={() => {
                                                                setFileToDelete(file);
                                                                setConfirmOpen(true);
                                                            }}
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>


                    <div className="md:hidden grid gap-4">
                        {filteredFiles.map((file) => (
                            <div
                                key={file.id}
                                className="rounded-xl border p-4 shadow-sm bg-white flex flex-col gap-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-base">{file.name}</span>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="w-4 h-4 cursor-pointer" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onClick={() => handleDownload(file)}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Download Excel
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-500 cursor-pointer"
                                                onClick={() => {
                                                    setFileToDelete(file);
                                                    setConfirmOpen(true);
                                                }}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="text-sm text-muted-foreground flex flex-col gap-1">
                                    <span>Uploaded: {format(new Date(file.createdAt), 'PP')}</span>
                                    <span>Updated: {file.updatedAt
                                        ? format(new Date(file.updatedAt), 'PP')
                                        : 'Not Yet'}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Button onClick={() => router.push(`/files/${file.id}`)} className="cursor-pointer" variant="outline">
                                        Open
                                    </Button>
                                    <Button onClick={() => handleDownload(file)} className="cursor-pointer">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}


            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p>This will permanently delete:</p>
                        <p className="font-medium text-foreground">{fileToDelete?.name}</p>
                    </div>
                    <div>
                        <Input placeholder='Delete Pin' onChange={(e) => setDeletePin(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button className="cursor-pointer" variant="ghost" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="cursor-pointer"
                            variant="destructive"
                            onClick={handleDeleteFile}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>


            <Dialog open={exportModalOpen} onOpenChange={closeExportModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                            Excel Export
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">

                        <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-600">Exporting file:</div>
                            <div className="font-medium text-gray-900 truncate">
                                {exportingFile?.name}
                            </div>
                        </div>


                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                {getStatusIcon()}
                                <div className="flex-1">
                                    <div className={`text-sm px-3 py-2 rounded-md ${getStatusColor()}`}>
                                        {exportProgress || 'Preparing...'}
                                    </div>
                                </div>
                            </div>
                            {exportStatus === 'loading' && (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                                </div>
                            )}
                        </div>


                        {exportStatus === 'success' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-green-800">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Export completed successfully!</span>
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                    Your Excel file has been downloaded.
                                </div>
                            </div>
                        )}

                        {exportStatus === 'error' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-red-800">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Export failed</span>
                                </div>
                                <div className="text-xs text-red-600 mt-1">
                                    Please try again or contact support if the issue persists.
                                </div>
                            </div>
                        )}
                    </div>


                    <div className="flex justify-end gap-2 mt-4">
                        {exportStatus === 'loading' ? (
                            <Button variant="outline" disabled>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Exporting...
                            </Button>
                        ) : (
                            <Button onClick={closeExportModal} className="cursor-pointer">
                                {exportStatus === 'success' ? 'Done' : 'Close'}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}