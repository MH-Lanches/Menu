/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Delivery from "./pages/Delivery";
import Admin from "./pages/Admin";
import PDV from "./pages/PDV";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Delivery />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/pdv" element={<PDV />} />
      </Routes>
    </Router>
  );
}
