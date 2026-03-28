import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { DEVICE_TYPES, TONER_COLORS, TONER_STATUSES } from "./constants.js";

function formatStamp(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusLabel(action) {
  return action === "DEPLOYED" ? "DEPLOYED" : "RETURNED";
}

export function ModalRoot({ modal, onClose, onSaveDevice, onSaveToner, onSaveUser, onChangePassword }) {
  if (!modal.type) return null;

  if (modal.type === "device") {
    return <DeviceDialog open initialValues={modal.payload} onClose={onClose} onSave={onSaveDevice} />;
  }
  if (modal.type === "toner") {
    return <TonerDialog open initialValues={modal.payload} onClose={onClose} onSave={onSaveToner} />;
  }
  if (modal.type === "user") {
    return <UserDialog open onClose={onClose} onSave={onSaveUser} />;
  }
  if (modal.type === "password") {
    return <PasswordDialog open user={modal.payload} onClose={onClose} onSave={onChangePassword} />;
  }
  if (modal.type === "history") {
    return <HistoryDialog open rows={modal.payload} onClose={onClose} />;
  }

  return null;
}

function DeviceDialog({ initialValues, onClose, onSave, open }) {
  const [values, setValues] = useState({
    asset_tag: initialValues?.asset_tag || "",
    serial: initialValues?.serial || "",
    type: initialValues?.type || DEVICE_TYPES[0],
    model: initialValues?.model || "",
    department: initialValues?.department || "",
    location: initialValues?.location || "",
    notes: initialValues?.notes || "",
  });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await onSave(values, initialValues?.id);
    } catch (issue) {
      setError(issue.message);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialValues ? "Edit Device" : "Add Device"}</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Asset Tag" value={values.asset_tag} onChange={(event) => setValues((current) => ({ ...current, asset_tag: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Serial" value={values.serial} onChange={(event) => setValues((current) => ({ ...current, serial: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField select fullWidth label="Type" value={values.type} onChange={(event) => setValues((current) => ({ ...current, type: event.target.value }))}>
                {DEVICE_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Model" value={values.model} onChange={(event) => setValues((current) => ({ ...current, model: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Department" value={values.department} onChange={(event) => setValues((current) => ({ ...current, department: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Location" value={values.location} onChange={(event) => setValues((current) => ({ ...current, location: event.target.value }))} /></Grid>
            <Grid size={12}><TextField fullWidth multiline minRows={3} label="Notes" value={values.notes} onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))} /></Grid>
          </Grid>
          <DialogActions sx={{ px: 0 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>Save Device</Button>
          </DialogActions>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function TonerDialog({ initialValues, onClose, onSave, open }) {
  const [values, setValues] = useState({
    serial: initialValues?.serial || "",
    color: initialValues?.color || TONER_COLORS[0],
    model: initialValues?.model || "",
    printer_asset: initialValues?.printer_asset || "",
    location: initialValues?.location || "",
    status: initialValues?.status || "In Stock",
    notes: initialValues?.notes || "",
  });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await onSave(values, initialValues?.id);
    } catch (issue) {
      setError(issue.message);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialValues ? "Edit Toner" : "Add Toner"}</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Serial" value={values.serial} onChange={(event) => setValues((current) => ({ ...current, serial: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField select fullWidth label="Color" value={values.color} onChange={(event) => setValues((current) => ({ ...current, color: event.target.value }))}>
                {TONER_COLORS.map((color) => <MenuItem key={color} value={color}>{color}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Model" value={values.model} onChange={(event) => setValues((current) => ({ ...current, model: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Printer Asset" value={values.printer_asset} onChange={(event) => setValues((current) => ({ ...current, printer_asset: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Location" value={values.location} onChange={(event) => setValues((current) => ({ ...current, location: event.target.value }))} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField select fullWidth label="Status" value={values.status} onChange={(event) => setValues((current) => ({ ...current, status: event.target.value }))}>
                {TONER_STATUSES.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={12}><TextField fullWidth multiline minRows={3} label="Notes" value={values.notes} onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))} /></Grid>
          </Grid>
          <DialogActions sx={{ px: 0 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>Save Toner</Button>
          </DialogActions>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function UserDialog({ onClose, onSave, open }) {
  const [values, setValues] = useState({ username: "", password: "", role: "technician" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await onSave(values);
    } catch (issue) {
      setError(issue.message);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add User</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField fullWidth label="Username" value={values.username} onChange={(event) => setValues((current) => ({ ...current, username: event.target.value }))} />
          <TextField select fullWidth label="Role" value={values.role} onChange={(event) => setValues((current) => ({ ...current, role: event.target.value }))}>
            <MenuItem value="technician">technician</MenuItem>
            <MenuItem value="admin">admin</MenuItem>
          </TextField>
          <TextField fullWidth label="Password" type="password" value={values.password} onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))} />
          <DialogActions sx={{ px: 0 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>Create User</Button>
          </DialogActions>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({ onClose, onSave, open, user }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await onSave(user.id, password);
    } catch (issue) {
      setError(issue.message);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Password: {user.username}</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField fullWidth type="password" label="New Password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <DialogActions sx={{ px: 0 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>Update Password</Button>
          </DialogActions>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ onClose, open, rows }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Device History</DialogTitle>
      <DialogContent dividers>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Technician</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length ? rows.map((row, index) => (
                <TableRow hover key={`${row.timestamp}-${index}`}>
                  <TableCell>{statusLabel(row.action)}</TableCell>
                  <TableCell>{row.assigned_to || "-"}</TableCell>
                  <TableCell>{row.technician}</TableCell>
                  <TableCell>{formatStamp(row.timestamp)}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={4} sx={{ py: 4, textAlign: "center" }}>No history for this asset.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
