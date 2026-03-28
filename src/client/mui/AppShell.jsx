import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  ThemeProvider,
  Tooltip,
  Toolbar,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
import MoveToInboxRoundedIcon from "@mui/icons-material/MoveToInboxRounded";
import AssignmentReturnedRoundedIcon from "@mui/icons-material/AssignmentReturnedRounded";
import LocalPrintshopRoundedIcon from "@mui/icons-material/LocalPrintshopRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import KeyboardDoubleArrowLeftRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftRounded";
import KeyboardDoubleArrowRightRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowRightRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import { alpha } from "@mui/material/styles";
import { Navigate, useLocation, useNavigate, Routes, Route } from "react-router-dom";
import * as XLSX from "xlsx";
import { createAppTheme } from "./theme.js";
import { ModalRoot } from "./dialogs.jsx";
import {
  AlertsPage,
  DashboardPage,
  HistoryPage,
  ImportPage,
  InventoryPage,
  ReportsPage,
  SettingsPage,
  TonerPage,
  UsersPage,
  ActionPage,
} from "./pages.jsx";
import { TONER_COLORS } from "./constants.js";

const drawerWidth = 286;
const collapsedDrawerWidth = 88;
const ROUTES = [
  { path: "/dashboard", label: "Dashboard", icon: <DashboardRoundedIcon /> },
  { path: "/inventory", label: "Inventory", icon: <DevicesRoundedIcon /> },
  { path: "/deploy", label: "Deploy", icon: <MoveToInboxRoundedIcon /> },
  { path: "/return", label: "Return", icon: <AssignmentReturnedRoundedIcon /> },
  { path: "/toner", label: "Toner", icon: <LocalPrintshopRoundedIcon /> },
  { path: "/history", label: "History", icon: <HistoryRoundedIcon /> },
  { path: "/reports", label: "Reports", icon: <InsightsRoundedIcon /> },
  { path: "/import", label: "Bulk Import", icon: <UploadFileRoundedIcon /> },
  { path: "/settings", label: "Settings", icon: <SettingsRoundedIcon /> },
  { path: "/alerts", label: "Alerts", icon: <WarningAmberRoundedIcon />, admin: true },
  { path: "/users", label: "Users", icon: <GroupRoundedIcon />, admin: true },
];

function api(path, options = {}) {
  return fetch(path, {
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  }).then(async (response) => {
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error || "Request failed";
      throw new Error(message);
    }
    return payload;
  });
}

function emptyDashboard() {
  return { stats: null, recent: [], loaded: false };
}

function emptyInventory() {
  return { devices: [], total: 0, loaded: false };
}

function emptyToner() {
  return { items: [], loaded: false };
}

function emptyAdmin() {
  return { alerts: [], users: [], loaded: false };
}

function buildLabelMarkup(device, tonerCounts) {
  const tonerLine = TONER_COLORS.map((color) => `${color[0]}:${tonerCounts[color] || 0}`).join("  ");
  return `
    <article class="print-label">
      <div class="print-org">City of Detroit Public Safety</div>
      <div class="print-title">DPD IT INVENTORY</div>
      <div class="print-row"><strong>Asset Tag:</strong><span>${device.asset_tag}</span></div>
      <div class="print-row"><strong>Serial:</strong><span>${device.serial}</span></div>
      <div class="print-row"><strong>Type:</strong><span>${device.type}</span></div>
      <div class="print-row"><strong>Model:</strong><span>${device.model || "-"}</span></div>
      <div class="print-row"><strong>Location:</strong><span>${device.location || "-"}</span></div>
      <div class="print-row"><strong>Dept:</strong><span>${device.department || "-"}</span></div>
      <div class="print-meta">Toner Stock ${tonerLine}</div>
    </article>
  `;
}

export default function AppShell() {
  const [colorMode, setColorMode] = useState(() => {
    try {
      return window.localStorage.getItem("dpd-color-mode") || "dark";
    } catch {
      return "dark";
    }
  });
  const muiTheme = useMemo(() => createAppTheme(colorMode), [colorMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem("dpd-color-mode", colorMode);
    } catch {
      // Ignore storage failures and keep the in-memory theme choice.
    }
  }, [colorMode]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <InventoryWorkspace
        colorMode={colorMode}
        muiTheme={muiTheme}
        onToggleColorMode={() => setColorMode((current) => (current === "dark" ? "light" : "dark"))}
      />
    </ThemeProvider>
  );
}

function InventoryWorkspace({ colorMode, muiTheme, onToggleColorMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname === "/" ? "/dashboard" : location.pathname;
  const fileInputRef = useRef(null);
  const themeMode = muiTheme;
  const mobile = useMediaQuery(themeMode.breakpoints.down("lg"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopNavCollapsed, setDesktopNavCollapsed] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [runtimeStatus, setRuntimeStatus] = useState("Checking worker health");
  const [bootstrapRequired, setBootstrapRequired] = useState(false);
  const [session, setSession] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authForm, setAuthForm] = useState({ username: "", password: "", confirm: "" });
  const [authMessage, setAuthMessage] = useState({ text: "", tone: "info" });
  const [snack, setSnack] = useState({ open: false, tone: "success", message: "" });
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [inventory, setInventory] = useState(emptyInventory);
  const [toner, setToner] = useState(emptyToner);
  const [historyRows, setHistoryRows] = useState([]);
  const [reportRows, setReportRows] = useState([]);
  const [adminData, setAdminData] = useState(emptyAdmin);
  const [profile, setProfile] = useState(null);
  const [deviceFilters, setDeviceFilters] = useState({
    page: 0,
    perPage: 25,
    search: "",
    type: "",
    status: "",
    sort: "updated_at",
    dir: "DESC",
  });
  const deferredSearch = useDeferredValue(deviceFilters.search);
  const [modal, setModal] = useState({ type: null, payload: null });

  const tonerCounts = useMemo(() => {
    const counts = { Black: 0, Cyan: 0, Magenta: 0, Yellow: 0 };
    toner.items.forEach((item) => {
      if (item.status === "In Stock" && counts[item.color] !== undefined) counts[item.color] += 1;
    });
    return counts;
  }, [toner.items]);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        setRuntimeStatus("Checking worker health");
        const [bootstrap, sessionStatus] = await Promise.all([api("/api/bootstrap/status"), api("/api/session")]);
        if (cancelled) return;
        setBootstrapRequired(bootstrap.bootstrapRequired);
        setSession(sessionStatus.user);
        setRuntimeStatus(sessionStatus.user ? "Online" : (bootstrap.bootstrapRequired ? "Setup required" : "Sign-in required"));
      } catch (error) {
        if (cancelled) return;
        setAuthMessage({ text: error.message, tone: "error" });
        setRuntimeStatus("Connection issue");
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    if (path === "/dashboard") {
      loadDashboard();
      loadToner();
      return;
    }
    if (path === "/inventory") return void loadDevices();
    if (path === "/toner") return void loadToner();
    if (path === "/history") return void loadHistory();
    if (path === "/reports") return void loadReports();
    if (path === "/alerts" || path === "/users") return void loadAdmin();
    if (path === "/settings") return void loadProfile();
  }, [session, path, deferredSearch, deviceFilters.page, deviceFilters.perPage, deviceFilters.status, deviceFilters.type, deviceFilters.sort, deviceFilters.dir]);

  function notify(message, tone = "success") {
    setSnack({ open: true, tone, message });
  }

  async function loadDashboard() {
    const payload = await api("/api/dashboard");
    setDashboard({ stats: payload.stats, recent: payload.recent, loaded: true });
  }

  async function loadDevices() {
    const query = new URLSearchParams({
      page: String(deviceFilters.page),
      per_page: String(deviceFilters.perPage),
      search: deferredSearch,
      type: deviceFilters.type,
      status: deviceFilters.status,
      sort: deviceFilters.sort,
      dir: deviceFilters.dir,
    });
    const payload = await api(`/api/devices?${query.toString()}`);
    setInventory({ devices: payload.devices, total: payload.total, loaded: true });
  }

  async function loadToner() {
    const payload = await api("/api/toner");
    setToner({ items: payload, loaded: true });
  }

  async function loadHistory() {
    setHistoryRows(await api("/api/history?limit=250"));
  }

  async function loadReports() {
    setReportRows(await api("/api/reports/technicians"));
  }

  async function loadAdmin() {
    if (session?.role !== "admin") return;
    const [alerts, users] = await Promise.all([api("/api/alerts"), api("/api/users")]);
    setAdminData({ alerts, users, loaded: true });
  }

  async function loadProfile() {
    const payload = await api("/api/profile");
    setProfile(payload.profile);
  }

  async function refreshOverview() {
    await Promise.all([loadDashboard(), loadToner()]);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (authBusy) return;

    try {
      setAuthBusy(true);
      if (bootstrapRequired) {
        if (!authForm.confirm) throw new Error("Please confirm your password.");
        if (authForm.password !== authForm.confirm) throw new Error("Passwords do not match.");
        await api("/api/bootstrap", { method: "POST", body: JSON.stringify({ username: authForm.username.trim(), password: authForm.password }) });
        setBootstrapRequired(false);
        setAuthMessage({ text: "Initial admin created. Sign in with that account.", tone: "success" });
        setAuthForm((current) => ({ ...current, password: "", confirm: "" }));
        setRuntimeStatus("Awaiting sign-in");
        return;
      }

      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ username: authForm.username.trim(), password: authForm.password }) });
      const sessionStatus = await api("/api/session");
      setSession(sessionStatus.user);
      setAuthMessage({ text: "", tone: "info" });
      setAuthForm({ username: "", password: "", confirm: "" });
      setRuntimeStatus("Online");
      navigate(path === "/" ? "/dashboard" : path, { replace: true });
      notify(`Welcome back, ${sessionStatus.user.username}.`, "success");
    } catch (error) {
      setAuthMessage({ text: error.message, tone: "error" });
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    await api("/api/auth/logout", { method: "POST" });
    setSession(null);
    setDashboard(emptyDashboard());
    setInventory(emptyInventory());
    setToner(emptyToner());
    setHistoryRows([]);
    setReportRows([]);
    setAdminData(emptyAdmin());
    setProfile(null);
    setRuntimeStatus("Sign-in required");
    navigate("/dashboard", { replace: true });
    notify("Signed out.", "info");
  }

  async function saveDevice(values, deviceId) {
    await api(deviceId ? `/api/devices/${deviceId}` : "/api/devices", {
      method: deviceId ? "PUT" : "POST",
      body: JSON.stringify(values),
    });
    setModal({ type: null, payload: null });
    await Promise.all([loadDevices(), refreshOverview()]);
    notify(deviceId ? "Device updated." : "Device added.", "success");
  }

  async function deleteDevice(deviceId) {
    if (!window.confirm("Delete this device? This removes its movement history too.")) return;
    await api(`/api/devices/${deviceId}`, { method: "DELETE" });
    await Promise.all([loadDevices(), refreshOverview()]);
    notify("Device deleted.", "success");
  }

  async function showDeviceHistory(deviceId) {
    const rows = await api(`/api/devices/${deviceId}/history`);
    setModal({ type: "history", payload: rows });
  }

  async function saveToner(values, tonerId) {
    await api(tonerId ? `/api/toner/${tonerId}` : "/api/toner", {
      method: tonerId ? "PUT" : "POST",
      body: JSON.stringify(values),
    });
    setModal({ type: null, payload: null });
    await Promise.all([loadToner(), refreshOverview()]);
    notify(tonerId ? "Toner updated." : "Toner added.", "success");
  }

  async function deleteToner(tonerId) {
    if (!window.confirm("Delete this toner record?")) return;
    await api(`/api/toner/${tonerId}`, { method: "DELETE" });
    await Promise.all([loadToner(), refreshOverview()]);
    notify("Toner deleted.", "success");
  }

  async function saveAlert(deviceType, threshold) {
    await api(`/api/alerts/${encodeURIComponent(deviceType)}`, { method: "PUT", body: JSON.stringify({ threshold }) });
    await Promise.all([loadAdmin(), refreshOverview()]);
    notify(`${deviceType} threshold saved.`, "success");
  }

  async function saveUser(values) {
    await api("/api/users", { method: "POST", body: JSON.stringify(values) });
    setModal({ type: null, payload: null });
    await loadAdmin();
    notify("User created.", "success");
  }

  async function saveProfile(values) {
    const payload = await api("/api/profile", { method: "PUT", body: JSON.stringify(values) });
    setProfile(payload.profile);
    setSession(payload.user);
    notify("Profile updated.", "success");
  }

  async function changeOwnPassword(values) {
    await api("/api/profile/password", { method: "PUT", body: JSON.stringify(values) });
    notify("Password updated.", "success");
  }

  async function changePassword(userId, password) {
    await api(`/api/users/${userId}/password`, { method: "PUT", body: JSON.stringify({ password }) });
    setModal({ type: null, payload: null });
    notify("Password updated.", "success");
  }

  async function deleteUser(userId) {
    if (!window.confirm("Delete this user account?")) return;
    await api(`/api/users/${userId}`, { method: "DELETE" });
    await loadAdmin();
    notify("User deleted.", "success");
  }

  async function deployDeviceAction(values) {
    await api("/api/devices/deploy", { method: "POST", body: JSON.stringify(values) });
    await refreshOverview();
    notify("Device deployed.", "success");
    navigate("/dashboard");
  }

  async function returnDeviceAction(values) {
    await api("/api/devices/return", { method: "POST", body: JSON.stringify(values) });
    await refreshOverview();
    notify("Device returned to stock.", "success");
    navigate("/dashboard");
  }

  async function importDevices(file) {
    const form = new FormData();
    let uploadFile = file;

    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error("The Excel file does not contain any worksheets.");
      }
      const csvText = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName], { blankrows: false });
      uploadFile = new File([csvText], file.name.replace(/\.(xlsx|xls)$/i, ".csv"), { type: "text/csv" });
    }

    form.append("file", uploadFile);
    const payload = await api("/api/import/devices.csv", { method: "POST", body: form });
    await Promise.all([loadDevices(), refreshOverview()]);
    notify(`Imported ${payload.added} devices. Skipped ${payload.skipped}.`, "success");
    navigate("/inventory");
  }

  function openImportPicker(mode = "all") {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = mode === "excel" ? ".xlsx,.xls" : mode === "csv" ? ".csv" : ".csv,.xlsx,.xls";
    fileInputRef.current.click();
  }

  function handleStatCard(filter) {
    setDeviceFilters((current) => {
      const next = { ...current, page: 0, search: "", type: "", status: "" };
      if (filter === "In Stock" || filter === "Deployed") next.status = filter;
      if (["Laptop", "Desktop", "Monitor", "TV", "Dock", "Printer"].includes(filter)) next.type = filter;
      return next;
    });
    navigate(filter === "Toner" ? "/toner" : "/inventory");
  }

  function toggleSort(sortKey) {
    setDeviceFilters((current) => ({
      ...current,
      page: 0,
      sort: sortKey,
      dir: current.sort === sortKey && current.dir === "ASC" ? "DESC" : "ASC",
    }));
  }

  function printLabels() {
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return notify("Allow popups to print labels.", "error");
    const labels = inventory.devices.map((device) => buildLabelMarkup(device, tonerCounts)).join("");
    popup.document.write(`
      <html>
      <head>
        <title>DPD Asset Labels</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; margin: 0; padding: .25in; background: #fff; color: #111; }
          .sheet { display: grid; grid-template-columns: repeat(2, 4in); gap: .14in; }
          .print-label { width: 4in; min-height: 2.2in; border: 1px solid #aaa; padding: 12px; display: grid; gap: 6px; break-inside: avoid; }
          .print-org { font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: #555; }
          .print-title { font: 700 20px Rajdhani, Arial, sans-serif; color: #0052cc; }
          .print-row { display: flex; justify-content: space-between; gap: 12px; font-size: 11px; }
          .print-meta { margin-top: 6px; font-size: 10px; color: #444; border-top: 1px solid #ddd; padding-top: 6px; }
        </style>
      </head>
      <body><div class="sheet">${labels}</div></body></html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  function printInventoryReport() {
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return notify("Allow popups to print inventory.", "error");

    const rows = inventory.devices.map((device) => `
      <tr>
        <td>${device.asset_tag}</td>
        <td>${device.serial}</td>
        <td>${device.type}</td>
        <td>${device.model || "-"}</td>
        <td>${device.status}</td>
        <td>${device.assigned_to || "-"}</td>
        <td>${device.department || "-"}</td>
        <td>${device.location || "-"}</td>
      </tr>
    `).join("");

    popup.document.write(`
      <html>
      <head>
        <title>DPD Inventory Report</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 24px; color: #111; }
          h1 { margin: 0 0 6px; font: 700 28px Rajdhani, Arial, sans-serif; color: #0b57d0; }
          p { margin: 0 0 16px; color: #555; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d8dce3; padding: 8px 10px; text-align: left; font-size: 12px; }
          th { background: #eef4fb; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
          tbody tr:nth-child(even) { background: #f8fafc; }
        </style>
      </head>
      <body>
        <h1>DPD IT Inventory Report</h1>
        <p>Showing ${inventory.devices.length} item(s) from the current inventory view. Printed ${new Date().toLocaleString()}.</p>
        <table>
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Serial</th>
              <th>Type</th>
              <th>Model</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Department</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="8">No inventory rows available.</td></tr>'}</tbody>
        </table>
      </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  function exportTonerExcel() {
    const workbook = XLSX.utils.book_new();
    const sheetRows = toner.items.map((row) => ({
      color: row.color,
      serial: row.serial,
      model: row.model || "",
      printer_asset: row.printer_asset || "",
      location: row.location || "",
      status: row.status,
      notes: row.notes || "",
      updated_at: row.updated_at || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Toner");
    XLSX.writeFile(workbook, "toner_inventory.xlsx");
  }

  function exportInventoryExcel() {
    const workbook = XLSX.utils.book_new();
    const sheetRows = inventory.devices.map((device) => ({
      asset_tag: device.asset_tag,
      serial: device.serial,
      type: device.type,
      model: device.model || "",
      status: device.status,
      assigned_to: device.assigned_to || "",
      department: device.department || "",
      location: device.location || "",
      notes: device.notes || "",
      updated_at: device.updated_at || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, "inventory_export.xlsx");
  }

  const navItems = ROUTES.filter((item) => !item.admin || session?.role === "admin");
  const currentMeta = ROUTES.find((item) => item.path === path) || ROUTES[0];
  const alertCount = dashboard.stats?.alerts?.length || 0;
  const desktopDrawerSize = desktopNavCollapsed ? collapsedDrawerWidth : drawerWidth;
  const profileMenuOpen = Boolean(profileMenuAnchor);

  function openProfileMenu(event) {
    setProfileMenuAnchor(event.currentTarget);
  }

  function closeProfileMenu() {
    setProfileMenuAnchor(null);
  }

  function openSettingsFromMenu() {
    closeProfileMenu();
    navigate("/settings");
    setMobileOpen(false);
  }

  async function handleLogoutFromMenu() {
    closeProfileMenu();
    await handleLogout();
  }

  function renderNavButton(item, collapsed = false) {
    const button = (
      <ListItemButton
        key={item.path}
        selected={path === item.path}
        onClick={() => {
          navigate(item.path);
          setMobileOpen(false);
        }}
        sx={{
          borderRadius: 3,
          mb: 0.5,
          minHeight: 52,
          justifyContent: collapsed ? "center" : "flex-start",
          px: collapsed ? 1.25 : 1.75,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? 0 : 42,
            mr: collapsed ? 0 : 0.5,
            justifyContent: "center",
          }}
        >
          {item.path === "/alerts" ? (
            <Badge color="warning" badgeContent={alertCount}>{item.icon}</Badge>
          ) : item.icon}
        </ListItemIcon>
        {!collapsed ? <ListItemText primary={item.label} /> : null}
      </ListItemButton>
    );

    return collapsed ? (
      <Tooltip key={item.path} title={item.label} placement="right">
        {button}
      </Tooltip>
    ) : button;
  }

  function renderDrawer(collapsed = false) {
    return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: collapsed ? 1.25 : 2.5 }}>
        {collapsed ? (
          <Stack spacing={1.25} alignItems="center">
            <Avatar
              variant="circular"
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                bgcolor: alpha("#4ea1ff", 0.18),
                color: "primary.main",
                flexShrink: 0,
              }}
            >
              D
            </Avatar>
            {!mobile ? (
              <Tooltip title="Expand sidebar" placement="right">
                <IconButton
                  onClick={() => setDesktopNavCollapsed(false)}
                  size="small"
                  sx={{
                    color: "text.secondary",
                    border: `1px solid ${alpha(themeMode.palette.text.primary, 0.12)}`,
                    borderRadius: "50%",
                  }}
                >
                  <KeyboardDoubleArrowRightRoundedIcon />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        ) : (
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                variant="circular"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  bgcolor: alpha("#4ea1ff", 0.18),
                  color: "primary.main",
                  flexShrink: 0,
                }}
              >
                D
              </Avatar>
              <Box>
                <Typography variant="h6">DPD IT</Typography>
                <Typography variant="body2" color="text.secondary">Cloudflare Inventory</Typography>
              </Box>
            </Stack>
            {!mobile ? (
              <Tooltip title="Collapse sidebar" placement="right">
                <IconButton onClick={() => setDesktopNavCollapsed(true)} size="small" sx={{ color: "text.secondary", borderRadius: "50%" }}>
                  <KeyboardDoubleArrowLeftRoundedIcon />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        )}
      </Box>
      <Divider />
      <List sx={{ px: collapsed ? 1 : 1.5, py: 1 }}>
        {navItems.map((item) => renderNavButton(item, collapsed))}
      </List>
      <Box sx={{ mt: "auto", p: collapsed ? 1.25 : 2 }}>
        <Stack spacing={1.5}>
          {session ? (
            collapsed ? (
              <Tooltip title="Account" placement="right">
                <IconButton
                  onClick={openProfileMenu}
                  sx={{ alignSelf: "center", border: `1px solid ${alpha(themeMode.palette.text.primary, 0.12)}`, borderRadius: "50%", p: 0.5, width: 46, height: 46 }}
                >
                  <Avatar variant="circular" src={session.avatar_data || undefined} sx={{ width: 34, height: 34, borderRadius: "50%" }}>
                    {(session.full_name || session.username || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
            ) : (
              <Button
                variant="outlined"
                onClick={openProfileMenu}
                sx={{ justifyContent: "flex-start", borderRadius: 3, p: 1.25 }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Avatar variant="circular" src={session.avatar_data || undefined} sx={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0 }}>
                    {(session.full_name || session.username || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box sx={{ textAlign: "left" }}>
                    <Typography variant="body2">{session.full_name || session.username}</Typography>
                    <Typography variant="caption" color="text.secondary">{session.role}</Typography>
                  </Box>
                </Stack>
              </Button>
            )
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          background: colorMode === "dark"
            ? "radial-gradient(circle at top left, rgba(78,161,255,.14), transparent 28%), radial-gradient(circle at right top, rgba(255,176,32,.1), transparent 26%), #091018"
            : "radial-gradient(circle at top left, rgba(78,161,255,.16), transparent 30%), radial-gradient(circle at right top, rgba(255,176,32,.14), transparent 24%), linear-gradient(180deg, #f7fbff 0%, #eaf2fb 100%)",
        }}
      >
        <AppBar position="fixed" sx={{ width: { lg: `calc(100% - ${desktopDrawerSize}px)` }, ml: { lg: `${desktopDrawerSize}px` } }}>
          <Toolbar sx={{ minHeight: 74 }}>
            {mobile ? (
              <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1.5 }}>
                <MenuRoundedIcon />
              </IconButton>
            ) : null}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="overline" color="text.secondary">Detroit Public Safety</Typography>
              <Typography variant="h5">{currentMeta.label}</Typography>
            </Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Tooltip title={colorMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                <IconButton onClick={onToggleColorMode} color="inherit">
                  {colorMode === "dark" ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
                </IconButton>
              </Tooltip>
              {session ? (
                <>
                  <Button
                    onClick={openProfileMenu}
                    sx={{
                      color: "inherit",
                      borderRadius: 999,
                      minWidth: 0,
                      px: { xs: 0.5, sm: 1 },
                      py: 0.75,
                      textTransform: "none",
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar variant="circular" src={session.avatar_data || undefined} sx={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }}>
                        {(session.full_name || session.username || "?").slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Box sx={{ textAlign: "left", display: { xs: "none", sm: "block" } }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{session.full_name || session.username}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {session.full_name ? `${session.username} • ${session.role}` : session.role}
                        </Typography>
                      </Box>
                    </Stack>
                  </Button>
                </>
              ) : null}
            </Stack>
          </Toolbar>
        </AppBar>

        <Box component="nav" sx={{ width: { lg: desktopDrawerSize }, flexShrink: { lg: 0 } }}>
          <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} variant="temporary" ModalProps={{ keepMounted: true }} sx={{ display: { xs: "block", lg: "none" }, "& .MuiDrawer-paper": { width: drawerWidth } }}>
            {renderDrawer(false)}
          </Drawer>
          <Drawer open variant="permanent" sx={{ display: { xs: "none", lg: "block" }, "& .MuiDrawer-paper": { width: desktopDrawerSize, overflowX: "hidden", transition: themeMode.transitions.create("width", { duration: themeMode.transitions.duration.shorter }) } }}>
            {renderDrawer(desktopNavCollapsed)}
          </Drawer>
        </Box>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, pt: { xs: 11, md: 12 }, width: { lg: `calc(100% - ${desktopDrawerSize}px)` } }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage dashboard={dashboard} tonerCounts={tonerCounts} onOpenHistory={() => navigate("/history")} onQuickNav={navigate} onStatClick={handleStatCard} />} />
            <Route path="/inventory" element={<InventoryPage filters={deviceFilters} inventory={inventory} lastPage={Math.max(0, Math.ceil(inventory.total / deviceFilters.perPage) - 1)} onAdd={() => setModal({ type: "device", payload: null })} onDelete={deleteDevice} onEdit={(device) => setModal({ type: "device", payload: device })} onHistory={showDeviceHistory} onFilterChange={setDeviceFilters} onImportCsv={() => openImportPicker("csv")} onImportExcel={() => openImportPicker("excel")} onExportCsv={() => { window.location.href = "/api/export/devices.csv"; }} onExportExcel={exportInventoryExcel} onPrintInventory={printInventoryReport} onPrintLabels={printLabels} onSort={toggleSort} session={session} />} />
            <Route path="/deploy" element={<ActionPage mode="deploy" onSubmit={deployDeviceAction} />} />
            <Route path="/return" element={<ActionPage mode="return" onSubmit={returnDeviceAction} />} />
            <Route path="/toner" element={<TonerPage counts={tonerCounts} rows={toner.items} onAdd={() => setModal({ type: "toner", payload: null })} onDelete={deleteToner} onEdit={(row) => setModal({ type: "toner", payload: row })} onExportExcel={exportTonerExcel} />} />
            <Route path="/history" element={<HistoryPage rows={historyRows} />} />
            <Route path="/reports" element={<ReportsPage rows={reportRows} />} />
            <Route path="/import" element={<ImportPage onSelect={() => openImportPicker("all")} />} />
            <Route path="/settings" element={<SettingsPage profile={profile || session} onSaveProfile={saveProfile} onChangePassword={changeOwnPassword} />} />
            <Route path="/alerts" element={session?.role === "admin" ? <AlertsPage alerts={adminData.alerts} onSave={saveAlert} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/users" element={session?.role === "admin" ? <UsersPage currentUser={session} onAdd={() => setModal({ type: "user", payload: null })} onChangePassword={(user) => setModal({ type: "password", payload: user })} onDelete={deleteUser} users={adminData.users} /> : <Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Box>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        hidden
        onChange={async (event) => {
          const [file] = event.target.files || [];
          if (!file) return;
          try {
            await importDevices(file);
          } catch (error) {
            notify(error.message, "error");
          } finally {
            event.target.value = "";
          }
        }}
      />

      <Menu
        anchorEl={profileMenuAnchor}
        open={profileMenuOpen}
        onClose={closeProfileMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 240,
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        {session ? (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Avatar variant="circular" src={session.avatar_data || undefined} sx={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }}>
                {(session.full_name || session.username || "?").slice(0, 1).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {session.full_name || session.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {session.full_name ? `${session.username} • ${session.role}` : session.role}
                </Typography>
              </Box>
            </Stack>
          </Box>
        ) : null}
        <Divider />
        <MenuItem onClick={openSettingsFromMenu}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ManageAccountsRoundedIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogoutFromMenu} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ minWidth: 36, color: "error.main" }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          Sign Out
        </MenuItem>
      </Menu>

      {!session ? (
        <AuthOverlay
          authBusy={authBusy}
          authForm={authForm}
          authMessage={authMessage}
          bootstrapRequired={bootstrapRequired}
          onChange={setAuthForm}
          onSubmit={handleAuthSubmit}
        />
      ) : null}

      <ModalRoot
        modal={modal}
        onClose={() => setModal({ type: null, payload: null })}
        onSaveDevice={saveDevice}
        onSaveToner={saveToner}
        onSaveUser={saveUser}
        onChangePassword={changePassword}
      />

      <Snackbar open={snack.open} autoHideDuration={3200} onClose={() => setSnack((current) => ({ ...current, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.tone === "error" ? "error" : snack.tone === "info" ? "info" : "success"} variant="filled" onClose={() => setSnack((current) => ({ ...current, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}

function AuthOverlay({ authBusy, authForm, authMessage, bootstrapRequired, onChange, onSubmit }) {
  function update(key, value) {
    onChange((current) => ({ ...current, [key]: value }));
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        p: 2,
        zIndex: 1300,
        background: (theme) => theme.palette.mode === "dark"
          ? "radial-gradient(circle at top left, rgba(78,161,255,.2), transparent 30%), rgba(0,0,0,.74)"
          : "radial-gradient(circle at top left, rgba(78,161,255,.16), transparent 30%), rgba(238,244,251,.92)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Box
        component="form"
        onSubmit={onSubmit}
        sx={{
          width: "min(440px, 100%)",
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          bgcolor: "background.paper",
          border: (theme) => `1px solid ${theme.palette.mode === "dark" ? alpha("#ffffff", 0.08) : alpha("#0f1722", 0.08)}`,
          boxShadow: 24,
        }}
      >
        <Stack spacing={2}>
          <Typography variant="overline" color="text.secondary">
            {bootstrapRequired ? "First Launch Setup" : "Secure Sign-In"}
          </Typography>
          <Typography variant="h4">{bootstrapRequired ? "Create the first admin account" : "Access the inventory workspace"}</Typography>
          <Typography variant="body2" color="text.secondary">
            {bootstrapRequired
              ? "This Cloudflare-native build no longer uses a default password. Create your admin login now."
              : "Use your admin or technician account to manage inventory, toner, alerts, and reporting."}
          </Typography>
          {authMessage.text ? <Alert severity={authMessage.tone === "error" ? "error" : "success"}>{authMessage.text}</Alert> : null}
          <TextField label="Username" value={authForm.username} onChange={(event) => update("username", event.target.value)} />
          <TextField label="Password" type="password" value={authForm.password} onChange={(event) => update("password", event.target.value)} />
          {bootstrapRequired ? <TextField label="Confirm Password" type="password" value={authForm.confirm} onChange={(event) => update("confirm", event.target.value)} /> : null}
          <Button type="submit" size="large" variant="contained" disabled={authBusy}>
            {bootstrapRequired ? "Create Admin" : "Sign In"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
