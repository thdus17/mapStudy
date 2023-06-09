package com.example.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class basicController {
	@GetMapping("/")
	public String pMain() {
		return "index";
	}
	
	@GetMapping("/map")
	public String map() {
		return "map";
	}
}
