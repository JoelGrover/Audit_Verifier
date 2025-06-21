"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit3, Info, Save, Search, Plus, Menu } from "lucide-react"
import axios from "axios"
import { useParams } from "next/navigation"
import { useToast } from "@/components/Toast/Toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function FileMaterialEditor() {
    const { success, error, info, warning } = useToast()
    const params = useParams()
    const fileId = params.id
    const [materialNumber, setMaterialNumber] = useState("")
    const [oracleNumber, setOracleNumber] = useState("")
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(false)
    const [editableData, setEditableData] = useState({})
    const [verificationData, setVerificationData] = useState({})
    const [activeTab, setActiveTab] = useState("material")
    const [editMode, setEditMode] = useState(false)
    const [users] = useState(["User 1", "User 2", "User 3", "User 4", "User 5", "User 6"])
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [materialRecord, setMaterialRecord] = useState('');
    const [fields, setFields] = useState([{ key: '', value: '' }]);
    const [open, setOpen] = useState(false);

    const addField = () => setFields([...fields, { key: '', value: '' }]);

    const handleFieldChange = (index, type, value) => {
        const updatedFields = [...fields];
        updatedFields[index][type] = value;
        setFields(updatedFields);
    };

    const handleSearch = async () => {
        setLoading(true)
        try {
            const res = await axios.get(`/api/get-data`, {
                params: {
                    fileId,
                    materialNumber,
                    oracleNumber
                },
            })


            const responseData = res.data
            const fetchedRecords = responseData.records || []
            setRecords(fetchedRecords)


            const initialEditableData = {}
            fetchedRecords.forEach(record => {
                initialEditableData[record.Id] = { ...record.data }
            })
            setEditableData(initialEditableData)


            const initialVerificationData = {}
            fetchedRecords.forEach(record => {
                initialVerificationData[record.Id] = {
                    "Verified Qty(mandatory)- numeric": record?.data["Verified Qty(mandatory)- numeric"] || "",
                    "Location(Not Mandotry) all": record?.data["Location(Not Mandotry) all"] || "",
                    "Remarks all": record?.data["Remarks all"] || "",
                    "Verified By": record?.data["Verified By"] || users[0],
                }
            })
            setVerificationData(initialVerificationData)

            console.log("Fetched records:", fetchedRecords)
            console.log("Material data:", initialEditableData)
            console.log("Verification data:", initialVerificationData)


            success(`Found ${fetchedRecords.length} record(s) for material ${materialNumber}`)

        } catch (e) {
            console.error("Error fetching data:", e)
            if (e.response?.status === 404) {
                info("No record found for this material number")
            } else {
                error("Failed to fetch data")
            }
            // Clear records on error
            setRecords([])
            setEditableData({})
            setVerificationData({})
        } finally {
            setLoading(false)
        }
    }

    const handleMaterialFieldChange = (recordId, key, value) => {
        setEditableData((prev) => ({
            ...prev,
            [recordId]: {
                ...prev[recordId],
                [key]: value,
            },
        }))
    }

    const handleVerificationFieldChange = (recordId, key, value) => {
        setVerificationData((prev) => ({
            ...prev,
            [recordId]: {
                ...prev[recordId],
                [key]: value,
            },
        }))
    }

    const addCustomField = (recordId) => {
        const key = prompt("Enter new field name")
        if (key && key.trim()) {
            handleVerificationFieldChange(recordId, key.trim(), "")
        }
    }

    const handleSave = async () => {
        try {
            setLoading(true)
            await axios.put("/api/edit-material-record", {
                fileId,
                updates: records.map((r) => ({
                    materialNumber: materialNumber || undefined,
                    oracleNumber: oracleNumber || undefined,
                    data: {
                        ...editableData[r.Id],
                        ...verificationData[r.Id],
                        updatedAt: Date.now()
                    },
                })),
            })
            success("Saved successfully")
            setEditMode(false)
        } catch (e) {
            console.error("Error saving:", e)
            error("Failed to save changes")
        } finally {
            setLoading(false)
        }
    }
    const TabButton = ({ tabId, label, isActive, onClick }) => (
        <button
            className={`px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-t-lg transition-all duration-200 flex-1 sm:flex-initial ${isActive
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
            onClick={() => onClick(tabId)}
        >
            <span className="truncate">{label}</span>
        </button>
    )

    const createRecord = async () => {
        const data = {};
        const markedFields = [];
        fields.forEach(({ key, value }) => {
            if (key) {
                data[key] = value;
                markedFields.push(key);
            }
        });

        try {
            const res = await axios.post('/api/create-material-record', {
                fileId,
                data,
                markedFields
            });

            alert(`Created Record ID: ${res.data.generatedId}`);
            setOpen(false);
        } catch (err) {
            alert('Error creating record: ' + err.response?.data?.message || err.message);
        }
    };
    return (
        <div className="min-h-screen bg-gray-50 sm:bg-white">

            <div className="sm:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-black">Material Editor</h1>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-md hover:bg-gray-100"
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            <div className="p-4 sm:p-6 max-w-7xl mx-auto">

                <div className="hidden sm:block bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-2xl lg:text-3xl font-bold text-black mb-2">Material Editor</h1>
                    <p className="text-gray-600 mb-6">Search and edit material records with ease</p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Enter Material Number"
                                value={materialNumber}
                                onChange={(e) => setMaterialNumber(e.target.value)}
                                className="pl-10 h-10 sm:h-12 text-base sm:text-lg"
                            />
                        </div>
                        OR
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Enter Oracle Number"
                                value={oracleNumber}
                                onChange={(e) => setOracleNumber(e.target.value)}
                                className="pl-10 h-10 sm:h-12 text-base sm:text-lg"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="h-10 sm:h-12 px-4 sm:px-6 w-full sm:w-auto"
                            size="lg"
                        >
                            {loading ? "Searching..." : "Search Material"}
                        </Button>
                    </div>
                </div>


                <div className="sm:hidden bg-white rounded-lg shadow-sm p-4 mb-4">
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Enter Material Number"
                                value={materialNumber}
                                onChange={(e) => setMaterialNumber(e.target.value)}
                                className="pl-10 h-12 text-base"
                            />
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Enter Oracle Number"
                                value={oracleNumber}
                                onChange={(e) => setOracleNumber(e.target.value)}
                                className="pl-10 h-12 text-base"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="h-12 w-full"
                            size="lg"
                        >
                            {loading ? "Searching..." : "Search Material"}
                        </Button>
                    </div>
                </div>

                {records.length === 0 && !loading && (
                    <Card className="text-center py-8 sm:py-12">
                        <CardContent>
                            <div className="text-gray-400 mb-4">
                                <Search className="h-12 sm:h-16 w-12 sm:w-16 mx-auto mb-4" />
                            </div>
                            <h3 className="text-base sm:text-lg font-medium text-black mb-2">No Records Found</h3>
                            <p className="text-sm sm:text-base text-gray-500 px-4">
                                Enter a material number above and click search to load records
                            </p>

                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="default" className="mt-4">CREATE MANUAL RECORD</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle>Create Material Record</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">

                                        {fields.map((field, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Input placeholder="Key (e.g  : Material Number )" value={field.key} onChange={(e) => handleFieldChange(index, 'key', e.target.value)} />
                                                <Input placeholder="Value" value={field.value} onChange={(e) => handleFieldChange(index, 'value', e.target.value)} />
                                            </div>
                                        ))}
                                        <Button variant="ghost" onClick={addField}>+ Add Field</Button>
                                        <Button onClick={createRecord} className="w-full mt-2">Submit</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                )}

                {records.map((record) => (
                    <Card key={record.Id} className="mb-4 sm:mb-6 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50 border-b p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <CardTitle className="text-lg sm:text-xl truncate">Material ID: {record.Id}</CardTitle>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">File ID: {record.fileId}</p>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                    <Badge variant={editMode ? "default" : "secondary"} className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                                        {editMode ? "Edit Mode" : "View Mode"}
                                    </Badge>
                                    <Button
                                        variant={editMode ? "outline" : "default"}
                                        onClick={() => setEditMode(!editMode)}
                                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
                                        size="sm"
                                    >
                                        <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline">{editMode ? "Exit Edit" : "Enable Edit"}</span>
                                        <span className="sm:hidden">{editMode ? "Exit" : "Edit"}</span>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">

                            {editMode && (
                                <Alert className="m-4 sm:m-6 mb-4 border-blue-200 bg-blue-50">
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-800 text-sm">
                                        <strong>Edit Mode Active:</strong> You can now modify all field values below. Fields marked as "Read
                                        Only" cannot be edited. Click "Save Changes" when done.
                                    </AlertDescription>
                                </Alert>
                            )}


                            <div className="flex border-b px-4 sm:px-6 pt-4 sm:pt-6">
                                <TabButton
                                    tabId="material"
                                    label="Material Data"
                                    isActive={activeTab === "material"}
                                    onClick={setActiveTab}
                                />
                                <TabButton
                                    tabId="verification"
                                    label="Verification"
                                    isActive={activeTab === "verification"}
                                    onClick={setActiveTab}
                                />
                            </div>

                            <div className="p-4 sm:p-6">

                                {activeTab === "material" && (
                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                            {Object.entries(editableData[record.Id] || {}).map(([key, value]) => (
                                                <div key={key} className="space-y-2">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                        <label className="text-sm font-medium text-gray-700 flex-1">{key}</label>
                                                        {key === "Material Number" && (
                                                            <Badge variant="outline" className="text-xs self-start sm:self-center">
                                                                Read Only
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Input
                                                        value={value || ""}
                                                        onChange={(e) => handleMaterialFieldChange(record.Id, key, e.target.value)}
                                                        disabled={!editMode || key === "Material Number"}
                                                        className={`h-10 sm:h-11 ${!editMode || key === "Material Number"
                                                            ? "bg-white text-black font-medium"
                                                            : "bg-white text-black border-blue-200 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                            }`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}


                                {activeTab === "verification" && (
                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                            {Object.entries(verificationData[record.Id] || {}).map(([key, value]) => (
                                                <div key={key} className="space-y-2">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                        <label className="text-sm font-medium text-gray-700 flex-1 break-words">{key}</label>
                                                        {key.includes("mandatory") && (
                                                            <Badge variant="destructive" className="text-xs self-start sm:self-center">
                                                                Required
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {key === "Verified By" ? (
                                                        <select
                                                            className={`w-full border rounded-md px-3 py-2 h-10 sm:h-11 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editMode ? "bg-gray-50 text-black font-medium" : "bg-white border-blue-200"}`}
                                                            value={value || users[0]}
                                                            onChange={(e) => handleVerificationFieldChange(record.Id, key, e.target.value)}
                                                            disabled={!editMode}
                                                        >
                                                            {users.map((user) => (
                                                                <option key={user} value={user}>
                                                                    {user}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : key === "Verified Qty(mandatory)- numeric" ? (
                                                        <Input
                                                            type="number"
                                                            placeholder="Enter verified quantity"
                                                            value={value || ""}
                                                            onChange={(e) => handleVerificationFieldChange(record.Id, key, e.target.value)}
                                                            disabled={!editMode}
                                                            className={`h-10 sm:h-11 ${!editMode ? "bg-gray-50 text-black font-medium" : "bg-white border-blue-200 focus:border-blue-400"}`}
                                                        />
                                                    ) : (
                                                        <Input
                                                            value={value || ""}
                                                            onChange={(e) => handleVerificationFieldChange(record.Id, key, e.target.value)}
                                                            disabled={!editMode}
                                                            className={`h-10 sm:h-11 ${!editMode ? "bg-gray-50 text-black font-medium" : "bg-white border-blue-200 focus:border-blue-400"
                                                                }`}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {editMode && (
                                            <Button
                                                variant="outline"
                                                onClick={() => addCustomField(record.Id)}
                                                className="flex items-center gap-2 mt-4 sm:mt-6 w-full sm:w-auto"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Custom Field
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {records.length > 0 && editMode && (
                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 sm:mt-6 sticky bottom-4 sm:static">
                        <Button
                            variant="outline"
                            onClick={() => setEditMode(false)}
                            className="px-4 sm:px-6 h-12 sm:h-10 order-2 sm:order-1"
                        >
                            Cancel Changes
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-4 sm:px-6 h-12 sm:h-10 flex items-center justify-center gap-2 order-1 sm:order-2"
                        >
                            <Save className="h-4 w-4" />
                            {loading ? "Loading..." : 'Save All Changes'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}