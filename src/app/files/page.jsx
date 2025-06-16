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
import { MoreHorizontal, Upload } from 'lucide-react';
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
        } catch (err) {
            error('Upload failed');
        } finally {
            setUploading(false);
        }
    }
    async function handleDeleteFile() {
        if (!fileToDelete) return;

        try {
            await axios.delete(`/api/delete-file?id=${fileToDelete.id}`);
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

    const filteredFiles = files.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
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
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                            <Button
                                className="cursor-pointer"
                                onClick={handleUpload}
                                disabled={uploading || !selectedFile}
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </Button>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-muted-foreground">
                    Loading files...
                </div>
            ) : files.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    No files available.
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block  rounded-lg border">
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
                                        <TableCell>{file.name}</TableCell>
                                        <TableCell>
                                            {format(new Date(file.createdAt), 'PPPpp')}
                                        </TableCell>
                                        <TableCell className="text-left">
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
                                                        <DropdownMenuItem className="cursor-pointer" onClick={() => alert('Download not implemented')}>
                                                            Download
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

                    {/* Mobile Card View */}
                    <div className="md:hidden grid gap-4">
                        {files.map((file) => (
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
                                            <DropdownMenuItem onClick={() => alert('Download not implemented')}>
                                                Download
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-500"
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
                                    <span>Uploaded:   {file.updatedAt
                                        ? format(new Date(file.updatedAt), 'PPPpp')
                                        : 'Not Yet'}</span>

                                </div>
                                <Button onClick={() => router.push(`/files/${file.id}`)} className="w-full mt-1 cursor-pointer">Open</Button>
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
                    <div className="flex justify-end gap-2 mt-4">
                        <Button className="cursor-pointer" variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                        <Button className="cursor-pointer"
                            variant="destructive"
                            onClick={handleDeleteFile}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
