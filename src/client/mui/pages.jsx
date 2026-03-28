import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import DevicesIcon from "@mui/icons-material/Devices";
import AssignmentReturnedIcon from "@mui/icons-material/AssignmentReturned";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import LaptopMacRoundedIcon from "@mui/icons-material/LaptopMacRounded";
import DesktopWindowsRoundedIcon from "@mui/icons-material/DesktopWindowsRounded";
import MonitorRoundedIcon from "@mui/icons-material/MonitorRounded";
import TvRoundedIcon from "@mui/icons-material/TvRounded";
import SettingsInputHdmiRoundedIcon from "@mui/icons-material/SettingsInputHdmiRounded";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import { alpha } from "@mui/material/styles";
import { DEVICE_TYPES, TONER_COLORS } from "./constants.js";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatStamp(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusChip(status) {
  if (status === "In Stock") return <Chip size="small" color="success" label={status} />;
  if (status === "Deployed" || status === "In Use") return <Chip size="small" color="primary" label={status} />;
  return <Chip size="small" color="error" label={status} />;
}

function colorChip(color) {
  const palette = {
    Black: { fg: "#ffffff", bg: "#1d1f24" },
    Cyan: { fg: "#7ee7ff", bg: "rgba(0,188,212,.14)" },
    Magenta: { fg: "#ff7ac8", bg: "rgba(233,30,99,.16)" },
    Yellow: { fg: "#ffd457", bg: "rgba(255,193,7,.15)" },
  }[color] || { fg: "#eef4fb", bg: "rgba(255,255,255,.08)" };

  return (
    <Chip
      size="small"
      label={color}
      sx={{
        color: palette.fg,
        backgroundColor: palette.bg,
      }}
    />
  );
}

export function DashboardPage({ dashboard, tonerCounts, onOpenHistory, onStatClick, onQuickNav }) {
  const stats = dashboard.stats || {};
  const total = Number(stats.total || 0);
  const deployed = Number(stats.deployed || 0);
  const instock = Number(stats.instock || 0);
  const readiness = total ? Math.round((instock / total) * 100) : 0;
  const saturation = total ? Math.round((deployed / total) * 100) : 0;
  const maxToner = Math.max(...TONER_COLORS.map((color) => tonerCounts[color] || 0), 1);

  const metricCards = [
    { label: "Total", value: total, color: "#7b8794", filter: "Total", icon: <DevicesIcon /> },
    { label: "In Stock", value: instock, color: "#2fbf71", filter: "In Stock", icon: <WarehouseOutlinedIcon /> },
    { label: "Deployed", value: deployed, color: "#4ea1ff", filter: "Deployed", icon: <BuildCircleOutlinedIcon /> },
    { label: "Laptops", value: stats.laptop || 0, color: "#1eb3c8", filter: "Laptop", icon: <LaptopMacRoundedIcon /> },
    { label: "Desktops", value: stats.desktop || 0, color: "#8a56ff", filter: "Desktop", icon: <DesktopWindowsRoundedIcon /> },
    { label: "Monitors", value: stats.monitor || 0, color: "#ff9736", filter: "Monitor", icon: <MonitorRoundedIcon /> },
    { label: "TVs", value: stats.tv || 0, color: "#35c89a", filter: "TV", icon: <TvRoundedIcon /> },
    { label: "Docks", value: stats.dock || 0, color: "#ff5ca8", filter: "Dock", icon: <SettingsInputHdmiRoundedIcon /> },
    { label: "Toner", value: stats.toner_instock || 0, color: "#ffbf2f", filter: "Toner", icon: <PrintOutlinedIcon /> },
  ];

  return (
    <Stack spacing={3}>
      {stats.alerts?.length ? (
        <Alert severity="warning" icon={<WarningAmberRoundedIcon fontSize="inherit" />} sx={{ borderRadius: 3 }}>
          <Stack spacing={0.5}>
            {stats.alerts.map((alert) => (
              <Typography key={alert.type} variant="body2">
                {alert.type}: only {alert.count} in stock (threshold {alert.threshold})
              </Typography>
            ))}
          </Stack>
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        {metricCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4, lg: 4 / 3 }}>
            <Card
              onClick={() => onStatClick(card.filter)}
              sx={{
                cursor: "pointer",
                background: `linear-gradient(135deg, ${alpha(card.color, 0.95)}, ${alpha(card.color, 0.65)})`,
                color: card.label === "Toner" ? "#1d1604" : "#ffffff",
                transition: "transform .18s ease, box-shadow .18s ease",
                "&:hover": { transform: "translateY(-4px)", boxShadow: 8 },
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Avatar sx={{ bgcolor: alpha("#ffffff", card.label === "Toner" ? 0.25 : 0.16), color: "inherit" }}>
                    {card.icon}
                  </Avatar>
                  <Typography variant="h3">{card.value}</Typography>
                </Stack>
                <Typography sx={{ mt: 2, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.92 }}>
                  {card.label}
                </Typography>
                {card.label === "Toner" ? (
                  <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.85 }}>
                    {TONER_COLORS.map((color) => `${color[0]} ${tonerCounts[color] || 0}`).join(" • ")}
                  </Typography>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6">Recent Activity</Typography>
                <Typography variant="body2" color="text.secondary">
                  Latest deploy and return events across the inventory floor.
                </Typography>
              </Box>
              <Button variant="outlined" onClick={onOpenHistory}>Open History</Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Asset Tag</TableCell>
                    <TableCell>Serial</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Technician</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboard.recent.length ? dashboard.recent.map((row) => (
                    <TableRow hover key={`${row.asset_tag}-${row.timestamp}`}>
                      <TableCell>{row.asset_tag}</TableCell>
                      <TableCell>{row.serial}</TableCell>
                      <TableCell>{statusChip(row.action === "DEPLOYED" ? "Deployed" : "In Stock")}</TableCell>
                      <TableCell>{row.assigned_to || "-"}</TableCell>
                      <TableCell>{row.technician}</TableCell>
                      <TableCell>{formatStamp(row.timestamp)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>{dashboard.loaded ? "No activity yet." : "Loading dashboard..."}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Operational Readiness</Typography>
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Stock readiness</Typography>
                    <Typography variant="body2">{readiness}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={readiness} color="success" sx={{ mt: 1, height: 10, borderRadius: 999 }} />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Deployment saturation</Typography>
                    <Typography variant="body2">{saturation}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={saturation} sx={{ mt: 1, height: 10, borderRadius: 999 }} />
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Toner Spectrum</Typography>
              <Stack spacing={1.5}>
                {TONER_COLORS.map((color) => (
                  <Box key={color}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {colorChip(color)}
                        <Typography variant="body2">{color}</Typography>
                      </Stack>
                      <Typography variant="body2">{tonerCounts[color] || 0}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.round(((tonerCounts[color] || 0) / maxToner) * 100)}
                      color={color === "Yellow" ? "warning" : color === "Magenta" ? "secondary" : color === "Cyan" ? "primary" : "inherit"}
                      sx={{ height: 8, borderRadius: 999 }}
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>

            <Paper sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
              <Stack spacing={1.25}>
                <Button variant="contained" onClick={() => onQuickNav("/deploy")}>Deploy Device</Button>
                <Button variant="outlined" onClick={() => onQuickNav("/return")}>Return Device</Button>
                <Button variant="outlined" onClick={() => onQuickNav("/inventory")}>Open Inventory</Button>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}

export function InventoryPage({
  filters,
  inventory,
  lastPage,
  onAdd,
  onDelete,
  onEdit,
  onFilterChange,
  onHistory,
  onImportCsv,
  onImportExcel,
  onExportCsv,
  onExportExcel,
  onPrintInventory,
  onPrintLabels,
  onSort,
  session,
}) {
  const start = inventory.total === 0 ? 0 : filters.page * filters.perPage + 1;
  const end = Math.min(inventory.total, start + inventory.devices.length - 1);
  const [menuAnchor, setMenuAnchor] = useState(null);

  function update(partial) {
    onFilterChange((current) => ({ ...current, ...partial }));
  }

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} justifyContent="space-between">
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="Search devices" value={filters.search} onChange={(event) => update({ search: event.target.value, page: 0 })} sx={{ minWidth: { xs: "100%", md: 240 } }} />
            <TextField select label="Type" value={filters.type} onChange={(event) => update({ type: event.target.value, page: 0 })} sx={{ minWidth: { xs: "100%", md: 160 } }}>
              <MenuItem value="">All Types</MenuItem>
              {DEVICE_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
            </TextField>
            <TextField select label="Status" value={filters.status} onChange={(event) => update({ status: event.target.value, page: 0 })} sx={{ minWidth: { xs: "100%", md: 160 } }}>
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="In Stock">In Stock</MenuItem>
              <MenuItem value="Deployed">Deployed</MenuItem>
            </TextField>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <Button variant="contained" onClick={onAdd}>Add Device</Button>
            <Button
              variant="outlined"
              endIcon={<MoreVertRoundedIcon />}
              onClick={(event) => setMenuAnchor(event.currentTarget)}
            >
              Options
            </Button>
          </Stack>
        </Stack>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={() => { setMenuAnchor(null); onImportCsv(); }}>
            <UploadFileRoundedIcon fontSize="small" style={{ marginRight: 10 }} />
            Import CSV
          </MenuItem>
          <MenuItem onClick={() => { setMenuAnchor(null); onImportExcel(); }}>
            <UploadFileRoundedIcon fontSize="small" style={{ marginRight: 10 }} />
            Import Excel
          </MenuItem>
          <MenuItem onClick={() => { setMenuAnchor(null); onExportCsv(); }}>
            <DownloadRoundedIcon fontSize="small" style={{ marginRight: 10 }} />
            Export CSV
          </MenuItem>
          <MenuItem onClick={() => { setMenuAnchor(null); onExportExcel(); }}>
            <TableChartRoundedIcon fontSize="small" style={{ marginRight: 10 }} />
            Export Excel
          </MenuItem>
          <MenuItem onClick={() => { setMenuAnchor(null); onPrintInventory(); }}>
            <PrintOutlinedIcon fontSize="small" style={{ marginRight: 10 }} />
            Print Inventory
          </MenuItem>
          <MenuItem onClick={() => { setMenuAnchor(null); onPrintLabels(); }}>
            <PrintOutlinedIcon fontSize="small" style={{ marginRight: 10 }} />
            Print Labels
          </MenuItem>
        </Menu>

        <Divider />

        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                {["asset_tag", "serial", "type", "model", "status", "assigned_to", "department", "location"].map((key) => (
                  <TableCell key={key}>
                    <Button
                      size="small"
                      color="inherit"
                      sx={{ p: 0, minWidth: 0, fontSize: 11, justifyContent: "flex-start" }}
                      onClick={() => onSort(key)}
                    >
                      {key.replace("_", " ")} {filters.sort === key ? (filters.dir === "ASC" ? "^" : "v") : ""}
                    </Button>
                  </TableCell>
                ))}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.devices.length ? inventory.devices.map((device) => (
                <TableRow hover key={device.id}>
                  <TableCell>{device.asset_tag}</TableCell>
                  <TableCell>{device.serial}</TableCell>
                  <TableCell>{device.type}</TableCell>
                  <TableCell>{device.model || "-"}</TableCell>
                  <TableCell>{statusChip(device.status)}</TableCell>
                  <TableCell>{device.assigned_to || "-"}</TableCell>
                  <TableCell>{device.department || "-"}</TableCell>
                  <TableCell>{device.location || "-"}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Button size="small" variant="outlined" onClick={() => onEdit(device)}>Edit</Button>
                      <Button size="small" variant="outlined" onClick={() => onHistory(device.id)}>History</Button>
                      {session?.role === "admin" ? <Button size="small" color="error" variant="outlined" onClick={() => onDelete(device.id)}>Delete</Button> : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={9} sx={{ color: "text.secondary", py: 5, textAlign: "center" }}>{inventory.loaded ? "No devices found." : "Loading inventory..."}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Showing {start}-{end} of {inventory.total}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="outlined" disabled={filters.page === 0} onClick={() => update({ page: 0 })}>First</Button>
            <Button size="small" variant="outlined" disabled={filters.page === 0} onClick={() => update({ page: filters.page - 1 })}>Prev</Button>
            <Button size="small" variant="outlined" disabled={filters.page >= lastPage} onClick={() => update({ page: filters.page + 1 })}>Next</Button>
            <Button size="small" variant="outlined" disabled={filters.page >= lastPage} onClick={() => update({ page: lastPage })}>Last</Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

export function TonerPage({ counts, rows, onAdd, onDelete, onEdit, onExportExcel }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ md: "center" }}>
          <Box>
            <Typography variant="h6">Toner Inventory</Typography>
            <Typography variant="body2" color="text.secondary">Track cartridge color balance and printer supply coverage.</Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <Button variant="contained" onClick={onAdd}>Add Toner</Button>
            <Button
              variant="outlined"
              endIcon={<MoreVertRoundedIcon />}
              onClick={(event) => setMenuAnchor(event.currentTarget)}
            >
              Options
            </Button>
          </Stack>
        </Stack>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem component="a" href="/api/export/toner.csv" onClick={() => setMenuAnchor(null)}>
            <DownloadRoundedIcon fontSize="small" style={{ marginRight: 10 }} />
            Export CSV
          </MenuItem>
          <MenuItem onClick={() => { setMenuAnchor(null); onExportExcel(); }}>
            <TableChartRoundedIcon fontSize="small" style={{ marginRight: 10 }} />
            Export Excel
          </MenuItem>
        </Menu>
      </Paper>

      <Grid container spacing={2}>
        {TONER_COLORS.map((color) => (
          <Grid key={color} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  {colorChip(color)}
                  <Typography variant="h4">{counts[color] || 0}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  In-stock {color.toLowerCase()} toner cartridges
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2.5 }}>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow>
                <TableCell>Color</TableCell>
                <TableCell>Serial</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Printer Asset</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length ? rows.map((row) => (
                <TableRow hover key={row.id}>
                  <TableCell>{colorChip(row.color)}</TableCell>
                  <TableCell>{row.serial}</TableCell>
                  <TableCell>{row.model || "-"}</TableCell>
                  <TableCell>{row.printer_asset || "-"}</TableCell>
                  <TableCell>{row.location || "-"}</TableCell>
                  <TableCell>{statusChip(row.status)}</TableCell>
                  <TableCell>{row.notes || "-"}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => onEdit(row)}>Edit</Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => onDelete(row.id)}>Delete</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={8} sx={{ color: "text.secondary", py: 5, textAlign: "center" }}>No toner records.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}

export function HistoryPage({ rows }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Checkout / Return History</Typography>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell>Asset Tag</TableCell>
              <TableCell>Serial</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Technician</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length ? rows.map((row) => (
              <TableRow hover key={`${row.asset_tag}-${row.timestamp}`}>
                <TableCell>{row.asset_tag}</TableCell>
                <TableCell>{row.serial}</TableCell>
                <TableCell>{statusChip(row.action === "DEPLOYED" ? "Deployed" : "In Stock")}</TableCell>
                <TableCell>{row.assigned_to || "-"}</TableCell>
                <TableCell>{row.technician}</TableCell>
                <TableCell>{formatStamp(row.timestamp)}</TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} sx={{ color: "text.secondary", py: 5, textAlign: "center" }}>No history yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export function ReportsPage({ rows }) {
  const technicianChartRows = rows.map((row) => ({
    name: row.technician,
    total: Number(row.total_actions || 0),
    deployed: Number(row.deployed || 0),
    returned: Number(row.returned || 0),
  }));

  const totals = technicianChartRows.reduce((acc, row) => ({
    deployed: acc.deployed + row.deployed,
    returned: acc.returned + row.returned,
  }), { deployed: 0, returned: 0 });

  const pieRows = [
    { name: "Deployed", value: totals.deployed, color: "#ffb547" },
    { name: "Returned", value: totals.returned, color: "#57d37c" },
  ].filter((item) => item.value > 0);

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 2.5, height: "100%" }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Technician Activity</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Total device handling by technician, split between deploy and return actions.
            </Typography>
            <Box sx={{ height: 320 }}>
              {technicianChartRows.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={technicianChartRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" stroke="#99a7ba" />
                    <YAxis stroke="#99a7ba" />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="deployed" name="Deployed" fill="#ffb547" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="returned" name="Returned" fill="#57d37c" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Stack justifyContent="center" alignItems="center" sx={{ height: "100%" }}>
                  <Typography variant="body2" color="text.secondary">No report data yet.</Typography>
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 2.5, height: "100%" }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Action Mix</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Overall deploy versus return balance across all technicians.
            </Typography>
            <Box sx={{ height: 320 }}>
              {pieRows.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieRows} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                      {pieRows.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Stack justifyContent="center" alignItems="center" sx={{ height: "100%" }}>
                  <Typography variant="body2" color="text.secondary">No report data yet.</Typography>
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Technician Summary</Typography>
        <List disablePadding>
          {rows.length ? rows.map((row, index) => (
            <Box key={row.technician}>
              <ListItem disableGutters sx={{ py: 1.5, flexWrap: "wrap", rowGap: 1.25 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: alpha("#4ea1ff", 0.22), color: "primary.main" }}>{row.technician.slice(0, 1).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={row.technician}
                  secondary={`Last action: ${formatStamp(row.last_action)}`}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`Total ${row.total_actions}`} color="primary" size="small" />
                  <Chip label={`Deployed ${row.deployed}`} color="warning" size="small" />
                  <Chip label={`Returned ${row.returned}`} color="success" size="small" />
                </Stack>
              </ListItem>
              {index < rows.length - 1 ? <Divider /> : null}
            </Box>
          )) : (
            <Typography variant="body2" color="text.secondary">No report data yet.</Typography>
          )}
        </List>
      </Paper>
    </Stack>
  );
}

export function ImportPage({ onSelect }) {
  return (
    <Paper sx={{ p: 3, maxWidth: 860, mx: "auto" }}>
      <Stack spacing={2}>
        <Typography variant="h5">Bulk Import Devices</Typography>
        <Alert severity="info">
          Required columns: <strong>asset_tag</strong>, <strong>serial</strong>, <strong>type</strong>, <strong>model</strong>.
          Optional columns: <strong>department</strong>, <strong>location</strong>, <strong>notes</strong>. Supported file types: <strong>.csv</strong>, <strong>.xlsx</strong>, and <strong>.xls</strong>.
        </Alert>
        <Card
          variant="outlined"
          sx={{ p: 4, borderStyle: "dashed", textAlign: "center" }}
        >
          <Stack spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 64, height: 64, bgcolor: alpha("#4ea1ff", 0.18), color: "primary.main" }}>
              <AssignmentReturnedIcon />
            </Avatar>
            <Typography variant="h6">Import CSV or Excel device lists</Typography>
            <Typography variant="body2" color="text.secondary">
              Excel sheets are converted in the browser and sent through the same validated import route you already use.
            </Typography>
            <Button variant="contained" size="large" onClick={onSelect}>Choose Import File</Button>
          </Stack>
        </Card>
      </Stack>
    </Paper>
  );
}

export function AlertsPage({ alerts, onSave }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Low Stock Thresholds</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tune the trigger point for each device family so the dashboard calls out shortages earlier.
      </Typography>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 680 }}>
          <TableHead>
            <TableRow>
              <TableCell>Device Type</TableCell>
              <TableCell>Current Stock</TableCell>
              <TableCell>Threshold</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Save</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.length ? alerts.map((row) => <AlertRow key={row.device_type} row={row} onSave={onSave} />) : (
              <TableRow><TableCell colSpan={5} sx={{ py: 5, textAlign: "center", color: "text.secondary" }}>No alert settings found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function AlertRow({ row, onSave }) {
  const [value, setValue] = useState(row.threshold);
  return (
    <TableRow hover>
      <TableCell>{row.device_type}</TableCell>
      <TableCell>{row.current_stock}</TableCell>
      <TableCell>
        <TextField type="number" size="small" value={value} onChange={(event) => setValue(Number(event.target.value))} sx={{ width: 110 }} />
      </TableCell>
      <TableCell>{row.alert ? <Chip size="small" color="warning" label="Low stock" /> : <Chip size="small" color="success" label="OK" />}</TableCell>
      <TableCell><Button size="small" variant="contained" onClick={() => onSave(row.device_type, value)}>Save</Button></TableCell>
    </TableRow>
  );
}

export function UsersPage({ currentUser, onAdd, onChangePassword, onDelete, users }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6">Users</Typography>
          <Typography variant="body2" color="text.secondary">Manage admin and technician accounts.</Typography>
        </Box>
        <Button variant="contained" onClick={onAdd}>Add User</Button>
      </Stack>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 520 }}>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length ? users.map((user) => (
              <TableRow hover key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell><Chip size="small" color={user.role === "admin" ? "primary" : "success"} label={user.role} /></TableCell>
                <TableCell>{formatStamp(user.updated_at)}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => onChangePassword(user)}>Password</Button>
                    {user.username !== currentUser?.username ? <Button size="small" color="error" variant="outlined" onClick={() => onDelete(user.id)}>Delete</Button> : null}
                  </Stack>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={4} sx={{ py: 5, textAlign: "center", color: "text.secondary" }}>No users found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export function ActionPage({ mode, onSubmit }) {
  const isDeploy = mode === "deploy";
  const [values, setValues] = useState({ code: "", assigned_to: "" });
  const [message, setMessage] = useState({ text: "", tone: "info" });

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await onSubmit(values);
      setValues({ code: "", assigned_to: "" });
      setMessage({ text: isDeploy ? "Device deployed successfully." : "Device returned to stock.", tone: "success" });
    } catch (error) {
      setMessage({ text: error.message, tone: "error" });
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 760, mx: "auto" }}>
      <Stack spacing={2}>
        <Typography variant="h5">{isDeploy ? "Deploy Device" : "Return Device"}</Typography>
        <Typography variant="body2" color="text.secondary">
          {isDeploy ? "Assign a device to a staff member or unit." : "Bring a device back into available stock."}
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: isDeploy ? 6 : 12 }}>
              <TextField
                label="Asset Tag or Serial Number"
                fullWidth
                value={values.code}
                onChange={(event) => setValues((current) => ({ ...current, code: event.target.value }))}
              />
            </Grid>
            {isDeploy ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Assign To"
                  fullWidth
                  value={values.assigned_to}
                  onChange={(event) => setValues((current) => ({ ...current, assigned_to: event.target.value }))}
                />
              </Grid>
            ) : null}
            <Grid size={12}>
              <Button type="submit" variant="contained" size="large" color={isDeploy ? "primary" : "success"}>
                {isDeploy ? "Deploy Device" : "Return to Stock"}
              </Button>
            </Grid>
          </Grid>
        </Box>
        {message.text ? <Alert severity={message.tone === "error" ? "error" : "success"}>{message.text}</Alert> : null}
      </Stack>
    </Paper>
  );
}

export function SettingsPage({ profile, onSaveProfile, onChangePassword }) {
  const [form, setForm] = useState({
    full_name: "",
    title: "",
    phone: "",
    badge_number: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [profileMessage, setProfileMessage] = useState({ text: "", tone: "success" });
  const [passwordMessage, setPasswordMessage] = useState({ text: "", tone: "success" });

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || "",
      title: profile?.title || "",
      phone: profile?.phone || "",
      badge_number: profile?.badge_number || "",
      avatar_data: profile?.avatar_data || "",
    });
  }, [profile]);

  async function handleAvatarChange(event) {
    const [file] = event.target.files || [];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 256;
        const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
        setForm((current) => ({ ...current, avatar_data: dataUrl }));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    try {
      await onSaveProfile(form);
      setProfileMessage({ text: "Profile updated.", tone: "success" });
    } catch (error) {
      setProfileMessage({ text: error.message, tone: "error" });
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    try {
      if (passwordForm.new_password !== passwordForm.confirm_password) {
        throw new Error("New password and confirmation do not match.");
      }
      await onChangePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordMessage({ text: "Password updated.", tone: "success" });
    } catch (error) {
      setPasswordMessage({ text: error.message, tone: "error" });
    }
  }

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5">Profile Settings</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage the personal details shown for your account and internal records.
              </Typography>
            </Box>
            {profileMessage.text ? <Alert severity={profileMessage.tone === "error" ? "error" : "success"}>{profileMessage.text}</Alert> : null}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <Avatar src={form.avatar_data || undefined} sx={{ width: 88, height: 88, fontSize: 32 }}>
                {(profile?.full_name || profile?.username || "?").slice(0, 1).toUpperCase()}
              </Avatar>
              <Stack spacing={1}>
                <Button component="label" variant="outlined" startIcon={<CloudUploadRoundedIcon />}>
                  Upload Picture
                  <input hidden type="file" accept="image/*" onChange={handleAvatarChange} />
                </Button>
                {form.avatar_data ? (
                  <Button variant="text" color="error" onClick={() => setForm((current) => ({ ...current, avatar_data: "" }))}>
                    Remove Picture
                  </Button>
                ) : null}
              </Stack>
            </Stack>
            <Box component="form" onSubmit={handleProfileSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Username" value={profile?.username || ""} disabled />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Role" value={profile?.role || ""} disabled />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Full Name" value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Title / Unit" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Badge Number" value={form.badge_number} onChange={(event) => setForm((current) => ({ ...current, badge_number: event.target.value }))} />
                </Grid>
                <Grid size={12}>
                  <Stack direction="row" justifyContent="flex-end">
                    <Button type="submit" variant="contained">Save Profile</Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5">Security</Typography>
              <Typography variant="body2" color="text.secondary">
                Change your own password without opening the admin user screen.
              </Typography>
            </Box>
            {passwordMessage.text ? <Alert severity={passwordMessage.tone === "error" ? "error" : "success"}>{passwordMessage.text}</Alert> : null}
            <Box component="form" onSubmit={handlePasswordSubmit}>
              <Stack spacing={2}>
                <TextField fullWidth type="password" label="Current Password" value={passwordForm.current_password} onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))} />
                <TextField fullWidth type="password" label="New Password" value={passwordForm.new_password} onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))} helperText="Minimum 10 characters" />
                <TextField fullWidth type="password" label="Confirm New Password" value={passwordForm.confirm_password} onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))} />
                <Stack direction="row" justifyContent="flex-end">
                  <Button type="submit" variant="contained" color="secondary">Update Password</Button>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
